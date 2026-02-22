"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProductFormSchema,
  ProductFormValues,
} from "@/lib/validators/product-schema";
import {
  upsertProduct,
  getProductsForCrossSell,
} from "@/actions/product-upsert";
import {
  generateProductMagic,
  searchProductImages,
  getColorName,
  importProductFromUrl,
} from "@/actions/ai-product-actions";
import { createQuickBrand, createQuickCategory } from "@/actions/quick-create";
import { useRouter } from "next/navigation";
import { useState, useTransition, useCallback, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  Save,
  ArrowLeft,
  Trash2,
  Image as ImageIcon,
  UploadCloud,
  Plus,
  Loader2,
  ListPlus,
  FileText,
  Star,
  ChevronDown,
  Search,
  Check,
  Sparkles,
  Wand2,
  Link2,
  Download,
  Palette,
  GitMerge,
  LayoutTemplate,
  X,
  CheckSquare,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import dynamic from "next/dynamic";

// ✅ Upgraded to react-quill-new for full Quill 2.0 Support
import "react-quill-new/dist/quill.snow.css";
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface CategoryOption {
  id: string;
  name: string;
  originalName: string;
}

interface ProductFormProps {
  initialData?: any;
  categories: CategoryOption[];
  brands: { id: string; name: string }[];
}

// --- HELPER: PARSE COLOR NAME TO HEX ---
const guessHexFromName = (colorName: string) => {
  let cssColor = colorName.toLowerCase().replace(/[^a-z0-9]/g, "");

  // Modern Device Marketing Colors
  if (cssColor.includes("obsidian")) return "#1e1e20";
  if (cssColor.includes("porcelain")) return "#f8f9fa";
  if (cssColor.includes("hazel")) return "#7e8376";
  if (cssColor.includes("rose") || cssColor.includes("quartz"))
    return "#f5cac3";
  if (cssColor.includes("midnight")) return "#1e293b";
  if (cssColor.includes("starlight")) return "#f8f9fa";
  if (cssColor.includes("coral")) return "#ff7f50";
  if (cssColor.includes("mint")) return "#3eb489";
  if (cssColor.includes("lilac")) return "#c8a2c8";
  if (cssColor.includes("cream")) return "#fffdd0";

  // Standard Colors
  if (cssColor.includes("blue")) return "#3b82f6";
  if (cssColor.includes("red")) return "#ef4444";
  if (cssColor.includes("green")) return "#22c55e";
  if (cssColor.includes("black")) return "#171717";
  if (cssColor.includes("white")) return "#ffffff";
  if (
    cssColor.includes("gray") ||
    cssColor.includes("grey") ||
    cssColor.includes("silver") ||
    cssColor.includes("titanium")
  )
    return "#9ca3af";
  if (cssColor.includes("orange")) return "#f97316";
  if (cssColor.includes("yellow")) return "#eab308";
  if (cssColor.includes("purple")) return "#a855f7";
  if (cssColor.includes("pink")) return "#ec4899";
  if (cssColor.includes("gold")) return "#fbbf24";
  if (cssColor.includes("brown")) return "#78350f";
  if (cssColor.includes("teal")) return "#14b8a6";
  if (cssColor.includes("cyan")) return "#06b6d4";
  if (cssColor.includes("indigo")) return "#6366f1";
  return null;
};

export default function ProductForm({
  initialData,
  categories: initialCategories,
  brands: initialBrands,
}: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [categories, setCategories] = useState(initialCategories);
  const [brands, setBrands] = useState(initialBrands);
  const [crossSellProducts, setCrossSellProducts] = useState<any[]>([]);

  const [catOpen, setCatOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [crossOpen, setCrossOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [crossSearch, setCrossSearch] = useState("");

  const [importUrl, setImportUrl] = useState("");
  const [isUrlImporting, setIsUrlImporting] = useState(false);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [isSearchingImages, setIsSearchingImages] = useState(false);
  const [googleImages, setGoogleImages] = useState<string[]>([]);
  const [autoSelected, setAutoSelected] = useState(false);

  const [suggestedCategory, setSuggestedCategory] = useState<string | null>(
    null,
  );
  const [suggestedBrand, setSuggestedBrand] = useState<string | null>(null);

  const [isCreatingBrand, setIsCreatingBrand] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const [mediaModal, setMediaModal] = useState<{
    isOpen: boolean;
    index: number | null;
  }>({ isOpen: false, index: null });
  const [applyToSimilar, setApplyToSimilar] = useState(true);

  const [optionColors, setOptionColors] = useState<Record<string, string>>({});

  const [options, setOptions] = useState<{ name: string; values: string }[]>(
    () => {
      if (initialData?.options) {
        try {
          const parsed =
            typeof initialData.options === "string"
              ? JSON.parse(initialData.options)
              : initialData.options;
          return parsed.map((o: any) => ({
            name: o.name,
            values: o.values.join(", "),
          }));
        } catch (e) { }
      }
      return [{ name: "", values: "" }];
    },
  );

  const catWrapperRef = useRef<HTMLDivElement>(null);
  const brandWrapperRef = useRef<HTMLDivElement>(null);
  const crossWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getProductsForCrossSell(initialData?.id).then(setCrossSellProducts);

    function handleClickOutside(event: MouseEvent) {
      if (
        catWrapperRef.current &&
        !catWrapperRef.current.contains(event.target as Node)
      )
        setCatOpen(false);
      if (
        brandWrapperRef.current &&
        !brandWrapperRef.current.contains(event.target as Node)
      )
        setBrandOpen(false);
      if (
        crossWrapperRef.current &&
        !crossWrapperRef.current.contains(event.target as Node)
      )
        setCrossOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [initialData?.id]);

  const defaultImages = initialData?.images
    ? typeof initialData.images === "string"
      ? JSON.parse(initialData.images)
      : initialData.images
    : [];
  const defaultSpecs = initialData?.specs
    ? initialData.specs.map((s: any) => ({
      name: s.attribute.name,
      value: s.value,
    }))
    : [];
  const defaultVariants = initialData?.variants
    ? initialData.variants.map((v: any) => ({
      name: v.name,
      sku: v.sku,
      price: Number(v.price),
      stock: v.stock,
      colorCode: v.colorCode,
      image: v.image,
    }))
    : [];
  const defaultCrossSells = initialData?.crossSells
    ? initialData.crossSells.map((c: any) => c.id)
    : [];

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(ProductFormSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      description: initialData?.description || "",
      price: initialData?.price ? Number(initialData.price) : 0,
      discountPrice: initialData?.discountPrice
        ? Number(initialData.discountPrice)
        : undefined,
      stock: initialData?.stock ? Number(initialData.stock) : 0,
      categoryId: initialData?.categoryId || "",
      brandId: initialData?.brandId || "",
      images: defaultImages,
      specs: defaultSpecs,
      variants: defaultVariants,
      isFeatured: initialData?.isFeatured || false,
      isArchived: initialData?.isArchived || false,
      metaTitle: initialData?.metaTitle || "",
      metaDescription: initialData?.metaDescription || "",
      keywords: initialData?.keywords || "",
      crossSells: defaultCrossSells,
    },
  });

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({ control: form.control, name: "images" as any });
  const {
    fields: specFields,
    append: appendSpec,
    remove: removeSpec,
  } = useFieldArray({ control: form.control, name: "specs" });
  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({ control: form.control, name: "variants" });

  const generateSKU = (productName: string, variantSuffix?: string) => {
    let skuBase = productName.substring(0, 4).toUpperCase();
    const words = productName.split(" ").filter((w) => w);
    if (words.length > 1) {
      skuBase = words
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .substring(0, 4);
    }
    if (variantSuffix) return `${skuBase}-${variantSuffix}`;
    return `${skuBase}-DEFAULT`;
  };

  const generateCombinations = () => {
    const validOptions = options.filter(
      (o) => o.name.trim() && o.values.trim(),
    );
    if (validOptions.length === 0)
      return toast.error(
        "Add at least one option with comma-separated values.",
      );

    const arrays = validOptions.map((o) =>
      o.values
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v),
    );
    const validArrays = arrays.filter((arr) => arr.length > 0);
    if (validArrays.length === 0)
      return toast.error("Please provide valid comma-separated values.");

    const cartesian = (args: string[][]) => {
      if (args.length === 0) return [];
      return args.reduce<string[][]>(
        (a, b) => a.flatMap((d) => b.map((e) => [...d, e])),
        [[]],
      );
    };

    const combos = cartesian(validArrays);
    const basePrice = form.getValues("price") || 0;
    const baseStock = form.getValues("stock") || 0;
    const baseName = form.getValues("name") || "PROD";

    if (variantFields.length > 0) {
      if (!confirm("This will replace your existing variants. Continue?"))
        return;
    }

    const newVariants = combos.map((combo) => {
      const variantName = combo.join(" / ");

      let predictedColorCode = null;
      validOptions.forEach((opt, index) => {
        if (opt.name.toLowerCase().includes("color")) {
          const colorVal = combo[index];
          predictedColorCode =
            optionColors[colorVal] || guessHexFromName(colorVal) || "#e5e7eb";
        }
      });

      const skuSuffix = combo
        .map((val) =>
          val
            .replace(/[^a-zA-Z0-9]/g, "")
            .substring(0, 3)
            .toUpperCase(),
        )
        .join("-");
      const sku = generateSKU(baseName, skuSuffix);

      return {
        name: variantName,
        sku: sku,
        price: basePrice,
        stock: baseStock,
        colorCode: predictedColorCode,
        image: null,
      };
    });

    form.setValue("variants", newVariants, { shouldDirty: true });
    toast.success(`Generated ${newVariants.length} structured combinations!`);
  };

  // --- ✅ FIX: MEDIA MANAGER SMART COLOR ASSIGNMENT ---
  const selectImageForVariant = (imgUrl: string) => {
    if (mediaModal.index === null) return;
    const targetVariant = form.getValues(`variants.${mediaModal.index}`);

    if (applyToSimilar && targetVariant?.name) {
      // 1. Identify which word in this variant's name represents the "Color"
      const colorOption = options.find((o) =>
        o.name.toLowerCase().includes("color"),
      );
      let colorPartToMatch = "";

      if (colorOption) {
        const colorVals = colorOption.values
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
        colorPartToMatch =
          colorVals.find((val) =>
            targetVariant.name.toLowerCase().includes(val.toLowerCase()),
          ) || "";
      }

      // Fallback if no specific "Color" option is found, guess based on format
      if (!colorPartToMatch) {
        if (targetVariant.name.includes("|")) {
          const parts = targetVariant.name.split("|");
          const colorSeg = parts.find((p) =>
            p.toLowerCase().includes("color:"),
          );
          if (colorSeg) colorPartToMatch = colorSeg.split(":")[1].trim();
        } else {
          colorPartToMatch = targetVariant.name.split("/")[0].trim();
        }
      }

      const allVariants = form.getValues("variants") || [];
      let applyCount = 0;

      allVariants.forEach((v, i) => {
        // Compare case-insensitively and apply to all matching colors
        if (
          colorPartToMatch &&
          v.name.toLowerCase().includes(colorPartToMatch.toLowerCase())
        ) {
          form.setValue(`variants.${i}.image`, imgUrl, { shouldDirty: true });
          applyCount++;
        }
      });

      toast.success(`Image applied to ${applyCount} variants!`);
    } else {
      form.setValue(`variants.${mediaModal.index}.image`, imgUrl, {
        shouldDirty: true,
      });
      toast.success("Variant image updated!");
    }
    setMediaModal({ isOpen: false, index: null });
  };

  const onMediaModalDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            const imgStr = reader.result;
            const currentImages = form.getValues("images") || [];
            // Automatically add to main product gallery if not already there
            if (!currentImages.includes(imgStr)) {
              appendImage(imgStr as any);
            }
            selectImageForVariant(imgStr); // Apply to the selected variant(s)
          }
        };
        reader.readAsDataURL(file);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [form, appendImage, applyToSimilar, mediaModal.index],
  );

  const {
    getRootProps: getMediaRootProps,
    getInputProps: getMediaInputProps,
    isDragActive: isMediaDragActive,
  } = useDropzone({
    onDrop: onMediaModalDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
  });
  // --- END MEDIA MANAGER LOGIC ---

  const handleUrlImport = async () => {
    if (!importUrl || !importUrl.startsWith("http"))
      return toast.error(
        "Please paste a valid full URL (e.g. https://amazon.com/...)",
      );

    setIsUrlImporting(true);
    toast.loading("Scraping and analyzing webpage...", { id: "urlImport" });

    const result = await importProductFromUrl(importUrl);

    if (result.error || !result.data) {
      toast.error(result.error || "Failed to parse data from URL", {
        id: "urlImport",
      });
      setIsUrlImporting(false);
      return;
    }

    applyAiDataToForm(result.data);

    if (result.data.images && result.data.images.length > 0) {
      const currentImages = form.getValues("images") || [];
      if (!currentImages.includes(result.data.images[0])) {
        appendImage(result.data.images[0] as any);
      }
    }

    toast.success("Product extracted successfully! ✨", { id: "urlImport" });
    setIsUrlImporting(false);
    setImportUrl("");
  };

  const handleMagicFill = async () => {
    const name = form.getValues("name");
    const currentDescription = form.getValues("description");
    if (!name || name.length < 3)
      return toast.error("Please enter a clear product name first");

    setIsMagicLoading(true);
    toast.loading("Generating product data...", { id: "magicFill" });
    const result = await generateProductMagic(name, currentDescription);

    if (result.data) {
      applyAiDataToForm(result.data);
      toast.success("Magic Fill Complete! ✨", { id: "magicFill" });
    } else {
      toast.error(result.error || "Magic Fill failed", { id: "magicFill" });
    }
    setIsMagicLoading(false);
  };

  const applyAiDataToForm = (data: any) => {
    if (data.name && !form.getValues("name")) {
      form.setValue("name", data.name, { shouldDirty: true });
      if (!form.getValues("slug")) {
        const generatedSlug = data.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        form.setValue("slug", generatedSlug, { shouldDirty: true });
      }
    }

    if (data.description)
      form.setValue("description", data.description, { shouldDirty: true });
    if (!form.getValues("metaTitle"))
      form.setValue("metaTitle", data.metaTitle, { shouldDirty: true });
    if (!form.getValues("metaDescription"))
      form.setValue("metaDescription", data.metaDescription, {
        shouldDirty: true,
      });
    if (!form.getValues("keywords"))
      form.setValue("keywords", data.keywords, { shouldDirty: true });

    const currentSpecs = form.getValues("specs") || [];
    if (currentSpecs.length === 0 && data.specs) {
      form.setValue("specs", data.specs, { shouldDirty: true });
    }

    if (data.price && !form.getValues("price")) {
      form.setValue("price", data.price, { shouldDirty: true });
    }

    let aiProvidedOptions = false;
    if (
      data.options &&
      Array.isArray(data.options) &&
      data.options.length > 0
    ) {
      const formattedOptions = data.options.map((o: any) => ({
        name: o.name,
        values: Array.isArray(o.values)
          ? o.values.join(", ")
          : String(o.values),
      }));
      setOptions(formattedOptions);
      aiProvidedOptions = true;
    }

    if (data.sku) {
      const currentVariants = form.getValues("variants") || [];
      if (currentVariants.length > 0 && !currentVariants[0].sku) {
        form.setValue(`variants.0.sku`, data.sku, { shouldDirty: true });
      } else if (currentVariants.length === 0 && !aiProvidedOptions) {
        appendVariant({
          name: "Default",
          sku: data.sku,
          price: data.price || form.getValues("price") || 0,
          stock: 10,
          colorCode: null,
          image: null,
        });
      }
    }

    let didAutoSelect = false;
    if (data.categorySuggestion && !form.getValues("categoryId")) {
      const suggLower = data.categorySuggestion.toLowerCase();
      const match = categories.find(
        (c) =>
          suggLower.includes(c.originalName?.toLowerCase() || "") ||
          c.originalName?.toLowerCase().includes(suggLower),
      );
      if (match) {
        form.setValue("categoryId", match.id, { shouldDirty: true });
        didAutoSelect = true;
        setSuggestedCategory(null);
      } else setSuggestedCategory(data.categorySuggestion);
    }

    if (data.brandSuggestion && !form.getValues("brandId")) {
      const suggLower = data.brandSuggestion.toLowerCase();
      const match = brands.find(
        (b) =>
          suggLower.includes(b.name.toLowerCase()) ||
          b.name.toLowerCase().includes(suggLower),
      );
      if (match) {
        form.setValue("brandId", match.id, { shouldDirty: true });
        didAutoSelect = true;
        setSuggestedBrand(null);
      } else setSuggestedBrand(data.brandSuggestion);
    }

    if (didAutoSelect) {
      setAutoSelected(true);
      setTimeout(() => setAutoSelected(false), 3000);
    }
  };

  const handleGoogleImageSearch = async () => {
    const name = form.getValues("name");
    if (!name) return toast.error("Please enter a product name first");
    setIsSearchingImages(true);
    const result = await searchProductImages(name);

    if (result.images && result.images.length > 0) {
      setGoogleImages(result.images);
      toast.success("Found images online!");
    } else toast.error(result.error || "No high-quality images found");
    setIsSearchingImages(false);
  };

  // --- 🎨 FIX: COLORTHIEF EXTRACTION & SMART VARIANT MAPPING ---
  const processImageColor = async (base64Str: string) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = async () => {
      try {
        const ColorThief = (await import("colorthief")).default;
        const ct = new ColorThief();
        const [r, g, b] = ct.getColor(img);
        const hex = `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;

        toast.loading("Analyzing image...", { id: "colorFetch" });
        const colorRes = await getColorName(hex);
        const exactColorName = colorRes.name || "Auto Color";
        toast.dismiss("colorFetch");

        const currentVariants = form.getValues("variants") || [];
        let matchedIndices: number[] = [];

        // Pre-fetch explicit color values to make matching foolproof
        const colorOption = options.find((o) =>
          o.name.toLowerCase().includes("color"),
        );
        let colorVals: string[] = [];
        if (colorOption) {
          colorVals = colorOption.values
            .split(",")
            .map((v) => v.trim().toLowerCase())
            .filter(Boolean);
        }

        currentVariants.forEach((v, i) => {
          let vColorPart = "";
          if (colorVals.length > 0) {
            vColorPart =
              colorVals.find((val) => v.name.toLowerCase().includes(val)) || "";
          }
          if (!vColorPart) {
            vColorPart = v.name.split("/")[0].trim().toLowerCase();
          }

          const detectedColorLower = exactColorName.toLowerCase();

          const hexMatch =
            v.colorCode && v.colorCode.toLowerCase() === hex.toLowerCase();
          const nameMatch = v.name.toLowerCase().includes(detectedColorLower);
          const inverseMatch =
            vColorPart.length > 2 && detectedColorLower.includes(vColorPart);

          if (hexMatch || nameMatch || inverseMatch) {
            matchedIndices.push(i);
          }
        });

        if (matchedIndices.length > 0) {
          matchedIndices.forEach((idx) => {
            form.setValue(`variants.${idx}.image`, base64Str, {
              shouldDirty: true,
            });
            if (
              !currentVariants[idx].colorCode ||
              currentVariants[idx].colorCode === "#ffffff"
            ) {
              form.setValue(`variants.${idx}.colorCode`, hex, {
                shouldDirty: true,
              });
            }
          });
          toast.success(
            `Image mapped to ${matchedIndices.length} existing variant(s)! 🎨`,
          );
        } else {
          appendVariant({
            name: exactColorName,
            sku: generateSKU(
              form.getValues("name") || "PROD",
              exactColorName
                .replace(/[^a-zA-Z0-9]/g, "")
                .substring(0, 3)
                .toUpperCase(),
            ),
            price: form.getValues("price") || 0,
            stock: form.getValues("stock") || 10,
            colorCode: hex,
            image: base64Str,
          });
          toast.success(`New variant created: ${exactColorName}! 🎨`);
        }
      } catch (e) {
        console.warn("ColorThief extraction failed", e);
      }
    };
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      )
        return;
      if (e.clipboardData?.files?.length) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            appendImage(result as any);
            processImageColor(result);
          };
          reader.readAsDataURL(file);
          toast.success("Image pasted from clipboard!");
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appendImage]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            appendImage(reader.result as any);
            processImageColor(reader.result);
          }
        };
        reader.readAsDataURL(file);
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [appendImage],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    if (!initialData) {
      form.setValue(
        "slug",
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, ""),
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") e.preventDefault();
  };

  const handleQuickCreateBrand = async (brandName: string) => {
    setIsCreatingBrand(true);
    const res = await createQuickBrand(brandName);

    if (res.success && res.brand) {
      setBrands((prev) =>
        [...prev, res.brand as { id: string; name: string }].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
      form.setValue("brandId", res.brand.id, { shouldDirty: true });
      setBrandOpen(false);
      setBrandSearch("");
      setSuggestedBrand(null);
      toast.success(`Brand "${res.brand.name}" created!`);
    } else {
      toast.error(res.error || "Failed to create brand");
    }
    setIsCreatingBrand(false);
  };

  const handleQuickCreateCategory = async (categoryPath: string) => {
    setIsCreatingCategory(true);
    const res = await createQuickCategory(categoryPath);

    if (res.success && res.category) {
      setCategories((prev) =>
        [...prev, res.category as CategoryOption].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
      form.setValue("categoryId", res.category.id, { shouldDirty: true });
      setCatOpen(false);
      setCatSearch("");
      setSuggestedCategory(null);
      toast.success(`Category "${res.category.name}" created!`);
    } else {
      toast.error(res.error || "Failed to create category");
    }
    setIsCreatingCategory(false);
  };

  const toggleCrossSell = (id: string) => {
    const current = form.getValues("crossSells") || [];
    if (current.includes(id)) {
      form.setValue(
        "crossSells",
        current.filter((c) => c !== id),
        { shouldDirty: true },
      );
    } else {
      form.setValue("crossSells", [...current, id], { shouldDirty: true });
    }
  };

  const onSubmit = (data: ProductFormValues) => {
    console.log("Form Data:", data);
    startTransition(async () => {
      const formattedOptions = options
        .filter((o) => o.name.trim() && o.values.trim())
        .map((o) => ({
          name: o.name.trim(),
          values: o.values
            .split(",")
            .map((v) => v.trim())
            .filter((v) => v),
        }));

      const payload = {
        ...data,
        options: JSON.stringify(formattedOptions),
      };

      if (!payload.brandId) payload.brandId = null;

      // @ts-ignore
      const result = await upsertProduct(payload, initialData?.id);
      if (result.error) toast.error(result.error);
      else {
        toast.success(result.success ?? "Product saved successfully");
        router.push("/dashboard/products");
        router.refresh();
      }
    });
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase()),
  );
  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase()),
  );
  const filteredCrossSells = crossSellProducts.filter((p) =>
    p.name.toLowerCase().includes(crossSearch.toLowerCase()),
  );

  return (
    <>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 max-w-6xl mx-auto pb-20"
      >
        <div className="flex items-center justify-between sticky top-0 z-20 bg-base-200/80 backdrop-blur-md py-4 -mx-4 px-4 border-b border-base-content/5">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/products"
              className="btn btn-circle btn-ghost"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                {initialData ? "Edit Product" : "New Product"}
              </h1>
              <p className="text-sm opacity-60">Inventory Management</p>
            </div>
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="btn btn-primary rounded-xl shadow-lg"
          >
            {isPending ? (
              <span className="loading loading-spinner"></span>
            ) : (
              <Save size={18} />
            )}
            Save Changes
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-base-content/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Basic Information</h2>
                      <p className="text-xs opacity-60">
                        Title, URL, and description.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="join border border-base-300 rounded-xl overflow-hidden shadow-sm">
                      <input
                        type="url"
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Paste competitor URL..."
                        className="input input-sm border-none join-item w-40 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleUrlImport}
                        disabled={isUrlImporting || !importUrl}
                        className="btn btn-sm btn-neutral join-item font-bold"
                      >
                        {isUrlImporting ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <LinkIcon size={14} />
                        )}{" "}
                        Extract
                      </button>
                    </div>

                    <span className="opacity-40 text-xs font-bold px-1">
                      OR
                    </span>

                    <button
                      type="button"
                      onClick={handleMagicFill}
                      disabled={isMagicLoading || !form.watch("name")}
                      className="btn btn-sm btn-secondary shadow-md shadow-secondary/20 rounded-xl gap-2"
                    >
                      {isMagicLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Wand2 size={14} />
                      )}
                      Magic Fill
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-control">
                      <label className="label font-medium text-sm">
                        Product Name <span className="text-error">*</span>
                      </label>
                      <input
                        {...form.register("name")}
                        onChange={handleNameChange}
                        onKeyDown={handleKeyDown}
                        className="input input-bordered w-full rounded-lg focus:border-primary"
                        placeholder="e.g. Premium Leather Jacket"
                      />
                    </div>

                    <div className="form-control">
                      <label className="label font-medium text-sm">
                        Slug (URL) <span className="text-error">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-xs text-base-content/40 font-mono select-none">
                          /product/
                        </span>
                        <input
                          {...form.register("slug")}
                          onKeyDown={handleKeyDown}
                          className="input input-bordered w-full rounded-lg pl-16 font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-control">
                    <label className="label font-medium text-sm">
                      Description
                    </label>
                    <div className="bg-base-100 rounded-xl border border-base-300 overflow-hidden [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-base-300 [&_.ql-toolbar]:bg-base-200/50 [&_.ql-container]:border-none [&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-base text-base-content">
                      <ReactQuill
                        theme="snow"
                        value={form.watch("description") || ""}
                        onChange={(val) =>
                          form.setValue("description", val, {
                            shouldDirty: true,
                          })
                        }
                        modules={{
                          toolbar: [
                            [{ header: [1, 2, 3, false] }],
                            ["bold", "italic", "underline", "strike"],
                            [{ list: "ordered" }, { list: "bullet" }],
                            ["clean"],
                          ],
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                  Product Options & Variants
                </h2>

                <div className="bg-base-200/30 p-5 rounded-2xl border border-base-200 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-base-content">
                        1. Define Options
                      </h3>
                      <p className="text-xs opacity-60">
                        e.g. Color: Silver, Blue | Storage: 256GB, 512GB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setOptions([...options, { name: "", values: "" }])
                      }
                      className="btn btn-xs btn-outline bg-base-100"
                    >
                      <Plus size={14} /> Add Option
                    </button>
                  </div>

                  <div className="space-y-3">
                    {options.map((opt, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <input
                          placeholder="Option (e.g. Color)"
                          className="input input-sm input-bordered w-1/3 rounded-lg font-medium"
                          value={opt.name}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => {
                            const newOpts = [...options];
                            newOpts[i].name = e.target.value;
                            setOptions(newOpts);
                          }}
                        />
                        <input
                          placeholder="Values (comma separated, e.g. Silver, Blue)"
                          className="input input-sm input-bordered flex-1 rounded-lg"
                          value={opt.values}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => {
                            const newOpts = [...options];
                            newOpts[i].values = e.target.value;
                            setOptions(newOpts);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newOpts = options.filter(
                              (_, idx) => idx !== i,
                            );
                            setOptions(newOpts);
                          }}
                          className="btn btn-sm btn-square btn-ghost text-error"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}

                    {options.some((o) => o.name.trim() && o.values.trim()) && (
                      <div className="mt-4 p-4 bg-base-100/80 rounded-xl border border-base-300 shadow-sm relative overflow-visible">
                        <div className="flex items-center gap-2 mb-3">
                          <LayoutTemplate size={14} className="text-primary" />
                          <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                            Storefront UI Preview
                          </span>
                        </div>
                        <div className="space-y-4">
                          {options
                            .filter((o) => o.name.trim() && o.values.trim())
                            .map((opt, i) => {
                              const isColorOption = opt.name
                                .toLowerCase()
                                .includes("color");
                              return (
                                <div key={i}>
                                  <p className="text-sm font-bold mb-2 flex items-center gap-2">
                                    {opt.name}
                                    {isColorOption && (
                                      <span className="text-[10px] font-normal opacity-50 ml-1">
                                        (Click circles to set hex codes)
                                      </span>
                                    )}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {opt.values
                                      .split(",")
                                      .map((v) => v.trim())
                                      .filter((v) => v)
                                      .map((v, j) => {
                                        if (isColorOption) {
                                          const cssColor =
                                            optionColors[v] ||
                                            guessHexFromName(v) ||
                                            "#e5e7eb";
                                          return (
                                            <div
                                              key={j}
                                              className="relative w-8 h-8 rounded-full border-2 border-base-300 shadow-sm transition-transform hover:scale-110 shrink-0 cursor-pointer overflow-hidden group"
                                              title={`Change color for ${v}`}
                                            >
                                              <input
                                                type="color"
                                                className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 opacity-0 cursor-pointer z-10"
                                                value={cssColor}
                                                onChange={(e) =>
                                                  setOptionColors((prev) => ({
                                                    ...prev,
                                                    [v]: e.target.value,
                                                  }))
                                                }
                                              />
                                              <div
                                                className="absolute inset-0 rounded-full"
                                                style={{
                                                  backgroundColor: cssColor,
                                                }}
                                              />
                                            </div>
                                          );
                                        }

                                        return (
                                          <div
                                            key={j}
                                            className="px-4 py-1.5 bg-base-100 border border-base-300 hover:border-primary rounded-lg text-sm font-medium shadow-sm transition-colors cursor-default"
                                          >
                                            {v}
                                          </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={generateCombinations}
                      className="btn btn-sm btn-primary w-full mt-2 shadow-lg shadow-primary/20"
                    >
                      <GitMerge size={16} className="mr-2" /> Generate
                      Combinations
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold opacity-70 uppercase tracking-wide">
                      2. Manage Variants
                    </h3>
                    <button
                      type="button"
                      onClick={() =>
                        appendVariant({
                          name: "",
                          sku: "",
                          price: form.getValues("price") || 0,
                          stock: form.getValues("stock") || 0,
                          image: null,
                          colorCode: null,
                        })
                      }
                      className="btn btn-xs btn-ghost gap-1"
                    >
                      <Plus size={14} /> Add Custom
                    </button>
                  </div>

                  <div className="space-y-3">
                    {variantFields.map((field, index) => {
                      const currentSku = form.watch(`variants.${index}.sku`);
                      return (
                        <div
                          key={field.id}
                          className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-base-200/30 p-3 rounded-xl border border-base-200 transition-all hover:border-primary/30"
                        >
                          <div
                            onClick={() =>
                              setMediaModal({ isOpen: true, index })
                            }
                            className="w-12 h-10 relative rounded-lg border border-base-300 overflow-hidden bg-base-100 shrink-0 cursor-pointer group shadow-sm tooltip tooltip-top"
                            data-tip="Change Variant Image"
                          >
                            {form.watch(`variants.${index}.image`) ? (
                              <img
                                src={
                                  form.watch(
                                    `variants.${index}.image`,
                                  ) as string
                                }
                                alt="Variant"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full opacity-30 group-hover:opacity-100 transition-opacity">
                                <ImageIcon size={14} />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <UploadCloud size={14} className="text-white" />
                            </div>
                          </div>

                          <div
                            className="w-full md:w-auto flex-1 tooltip tooltip-top"
                            data-tip="Matches UI selection (e.g. Silver / 256GB)"
                          >
                            <input
                              {...form.register(`variants.${index}.name`)}
                              placeholder="e.g. Silver / 256GB"
                              onKeyDown={handleKeyDown}
                              className="input input-sm input-bordered w-full font-semibold"
                              onChange={(e) => {
                                form
                                  .register(`variants.${index}.name`)
                                  .onChange(e);
                                const pName = form.getValues("name");
                                if (!currentSku && pName) {
                                  const val = e.target.value;
                                  let suffix = val
                                    .split("/")
                                    .map((v) =>
                                      v
                                        .replace(/[^a-zA-Z0-9]/g, "")
                                        .substring(0, 3)
                                        .toUpperCase(),
                                    )
                                    .join("-");
                                  form.setValue(
                                    `variants.${index}.sku`,
                                    generateSKU(pName, suffix),
                                    { shouldDirty: true },
                                  );
                                }
                              }}
                            />
                          </div>
                          <div className="w-full md:w-28">
                            <input
                              {...form.register(`variants.${index}.sku`)}
                              placeholder="SKU"
                              onKeyDown={handleKeyDown}
                              className="input input-sm input-bordered w-full font-mono text-xs"
                            />
                          </div>

                          <div
                            className="w-8 h-8 relative tooltip tooltip-top shrink-0 hover:ring-2 hover:ring-primary hover:ring-offset-1 rounded-full transition-all"
                            data-tip="Click to change color manually"
                          >
                            <input
                              type="color"
                              {...form.register(`variants.${index}.colorCode`)}
                              className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 opacity-0 cursor-pointer z-10"
                            />
                            <div
                              className="absolute inset-0 rounded-full border border-base-300 shadow-inner flex items-center justify-center"
                              style={{
                                backgroundColor:
                                  form.watch(`variants.${index}.colorCode`) ||
                                  "#ffffff",
                              }}
                            >
                              {!form.watch(`variants.${index}.colorCode`) && (
                                <Palette
                                  size={12}
                                  className="opacity-50 mix-blend-difference pointer-events-none"
                                />
                              )}
                            </div>
                          </div>

                          <div className="w-24">
                            <input
                              type="number"
                              {...form.register(`variants.${index}.price`)}
                              onKeyDown={handleKeyDown}
                              placeholder="Price"
                              className="input input-sm input-bordered w-full"
                            />
                          </div>
                          <div className="w-20">
                            <input
                              type="number"
                              {...form.register(`variants.${index}.stock`)}
                              onKeyDown={handleKeyDown}
                              placeholder="Stock"
                              className="input input-sm input-bordered w-full"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="btn btn-sm btn-square btn-ghost text-error shrink-0"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                    {variantFields.length === 0 && (
                      <p className="text-xs text-center opacity-50 py-4">
                        No variants defined. Add options above or create a
                        custom variant.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <span className="w-1 h-6 bg-secondary rounded-full"></span>
                    Specifications
                  </h2>
                  <button
                    type="button"
                    onClick={() => appendSpec({ name: "", value: "" })}
                    className="btn btn-xs btn-ghost gap-1"
                  >
                    <ListPlus size={14} /> Add Spec
                  </button>
                </div>
                <div className="space-y-3">
                  {specFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex gap-2 items-start group"
                    >
                      <div className="flex-1">
                        <input
                          {...form.register(`specs.${index}.name`)}
                          onKeyDown={handleKeyDown}
                          placeholder="Attribute (e.g. Material)"
                          className="input input-sm input-bordered w-full"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          {...form.register(`specs.${index}.value`)}
                          onKeyDown={handleKeyDown}
                          placeholder="Value (e.g. Cotton)"
                          className="input input-sm input-bordered w-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSpec(index)}
                        className="btn btn-sm btn-square btn-ghost text-base-content/40 hover:text-error"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-200 overflow-visible">
              <div className="card-body p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <span className="w-1 h-6 bg-accent rounded-full"></span>
                    Gallery
                  </h2>
                  <button
                    type="button"
                    onClick={handleGoogleImageSearch}
                    disabled={isSearchingImages || !form.watch("name")}
                    className="btn btn-xs btn-outline gap-1"
                  >
                    {isSearchingImages ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Search size={12} />
                    )}
                    Find on Google
                  </button>
                </div>

                {googleImages.length > 0 && (
                  <div className="mb-4 p-4 bg-base-200/50 rounded-xl border border-base-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold uppercase opacity-60">
                        Click to add to gallery
                      </span>
                      <button
                        type="button"
                        onClick={() => setGoogleImages([])}
                        className="text-xs text-error hover:underline"
                      >
                        Close
                      </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {googleImages.map((img, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            appendImage(img as any);
                            processImageColor(img);
                            toast.success("Image added!");
                          }}
                          className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary transition-all group"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img}
                            alt="Google Result"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Download
                              size={20}
                              className="text-white drop-shadow-md"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${isDragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-base-300 hover:border-primary/50 hover:bg-base-200/50"}`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className={`p-4 rounded-full ${isDragActive ? "bg-primary text-white" : "bg-base-200 text-base-content/50"}`}
                    >
                      <UploadCloud size={32} />
                    </div>
                    <div>
                      <p className="font-bold text-lg">
                        Click, drag, or Ctrl+V to paste images
                      </p>
                      <p className="text-sm opacity-50">
                        Colors will be extracted and matched to variants
                        automatically
                      </p>
                    </div>
                  </div>
                </div>

                {imageFields.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 mt-6">
                    {imageFields.map((field, index) => {
                      const imgUrl = form.watch(`images.${index}`);
                      return (
                        <div
                          key={field.id}
                          className="relative group aspect-square bg-base-200 rounded-xl overflow-hidden border border-base-300"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <ImageIcon className="opacity-20" />
                            </div>
                          )}
                          {index === 0 && (
                            <span className="absolute top-2 left-2 badge badge-primary badge-sm shadow-md z-10 flex gap-1 items-center font-bold text-[10px]">
                              <Star size={8} fill="currentColor" /> Main
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-info rounded-full"></span>
                  SEO & Metadata
                </h2>
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label font-bold text-xs">
                      Meta Title
                    </label>
                    <input
                      {...form.register("metaTitle")}
                      onKeyDown={handleKeyDown}
                      className="input input-bordered input-sm w-full"
                      placeholder="SEO Title (60 chars max)"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-xs">
                      Meta Description
                    </label>
                    <textarea
                      {...form.register("metaDescription")}
                      className="textarea textarea-bordered h-20 text-sm"
                      placeholder="SEO Description (160 chars max)"
                    />
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-xs">Keywords</label>
                    <input
                      {...form.register("keywords")}
                      onKeyDown={handleKeyDown}
                      className="input input-bordered input-sm w-full"
                      placeholder="e.g. jacket, winter, leather"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-primary rounded-full"></span>
                  Pricing
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  <div className="form-control">
                    <label className="label font-bold text-sm">
                      Base Price
                    </label>
                    <label className="input input-bordered flex items-center gap-2">
                      <span className="opacity-50 text-xs font-bold">NRP</span>
                      <input
                        type="number"
                        {...form.register("price")}
                        onKeyDown={handleKeyDown}
                        className="grow"
                        placeholder="0.00"
                        min="0"
                      />
                    </label>
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-sm">
                      Discount Price
                    </label>
                    <label className="input input-bordered flex items-center gap-2">
                      <span className="opacity-50 text-xs font-bold">NRP</span>
                      <input
                        type="number"
                        {...form.register("discountPrice")}
                        onKeyDown={handleKeyDown}
                        className="grow"
                        placeholder="Optional"
                        min="0"
                      />
                    </label>
                  </div>
                  <div className="form-control">
                    <label className="label font-bold text-sm">
                      Base Stock
                    </label>
                    <input
                      type="number"
                      {...form.register("stock")}
                      onKeyDown={handleKeyDown}
                      className="input input-bordered"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-6">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Link2 size={18} className="text-secondary" />
                  Bought Together
                </h2>

                <div className="form-control relative" ref={crossWrapperRef}>
                  <div
                    onClick={() => setCrossOpen(!crossOpen)}
                    className="input input-bordered w-full rounded-lg flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-sm font-medium">
                      {form.watch("crossSells")?.length} items selected
                    </span>
                    <ChevronDown size={16} className="opacity-50" />
                  </div>

                  {crossOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-200 rounded-xl shadow-xl z-50 p-2">
                      <div className="relative mb-2">
                        <Search
                          size={14}
                          className="absolute left-3 top-3 opacity-50"
                        />
                        <input
                          value={crossSearch}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setCrossSearch(e.target.value)}
                          placeholder="Search products..."
                          className="input input-sm input-bordered w-full pl-9 rounded-lg"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {filteredCrossSells.map((product) => {
                          const isSelected = form
                            .watch("crossSells")
                            ?.includes(product.id);
                          return (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => toggleCrossSell(product.id)}
                              className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-base-200 flex justify-between items-center ${isSelected ? "bg-secondary/10 text-secondary font-bold" : ""}`}
                            >
                              <span className="truncate pr-2">
                                {product.name}
                              </span>
                              {isSelected && (
                                <Check size={14} className="shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-6">
                <h2 className="text-lg font-bold mb-4">Organization</h2>

                <div className="form-control mb-6 relative" ref={catWrapperRef}>
                  <label className="label font-bold text-sm">
                    Category
                    {autoSelected && (
                      <span className="badge badge-accent badge-xs gap-1 animate-pulse">
                        <Sparkles size={10} />
                      </span>
                    )}
                  </label>
                  <div
                    onClick={() => setCatOpen(!catOpen)}
                    className="input input-bordered w-full rounded-lg flex items-center justify-between cursor-pointer"
                  >
                    <span
                      className={
                        form.watch("categoryId")
                          ? "text-base-content"
                          : "text-base-content/40"
                      }
                    >
                      {categories.find((c) => c.id === form.watch("categoryId"))
                        ?.name || "Select Category"}
                    </span>
                    <ChevronDown size={16} className="opacity-50" />
                  </div>

                  {catOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-200 rounded-xl shadow-xl z-50 p-2">
                      <div className="relative mb-2">
                        <Search
                          size={14}
                          className="absolute left-3 top-3 opacity-50"
                        />
                        <input
                          autoFocus
                          value={catSearch}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setCatSearch(e.target.value)}
                          placeholder="Search..."
                          className="input input-sm input-bordered w-full pl-9 rounded-lg"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {filteredCategories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              form.setValue("categoryId", cat.id);
                              setCatOpen(false);
                              setSuggestedCategory(null);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-base-200 flex justify-between items-center ${form.watch("categoryId") === cat.id ? "bg-primary/10 text-primary font-bold" : ""}`}
                          >
                            {cat.name}
                            {form.watch("categoryId") === cat.id && (
                              <Check size={14} />
                            )}
                          </button>
                        ))}

                        {catSearch.trim() !== "" &&
                          !categories.some(
                            (c) =>
                              c.name.toLowerCase() ===
                              catSearch.trim().toLowerCase(),
                          ) && (
                            <button
                              type="button"
                              disabled={isCreatingCategory}
                              onClick={() =>
                                handleQuickCreateCategory(catSearch.trim())
                              }
                              className="w-full text-left px-3 py-2 rounded-lg text-sm bg-primary/5 hover:bg-primary/10 text-primary font-bold flex justify-between items-center transition-colors mt-2"
                            >
                              <span>+ Create "{catSearch.trim()}"</span>
                              {isCreatingCategory && (
                                <Loader2 size={14} className="animate-spin" />
                              )}
                            </button>
                          )}
                      </div>
                    </div>
                  )}
                </div>

                {suggestedCategory && !form.watch("categoryId") && (
                  <button
                    type="button"
                    disabled={isCreatingCategory}
                    onClick={() => handleQuickCreateCategory(suggestedCategory)}
                    className="w-full text-left text-xs text-secondary mt-1 mb-6 flex items-center gap-1 hover:underline cursor-pointer animate-in fade-in"
                  >
                    <Sparkles size={12} />
                    {isCreatingCategory ? (
                      "Creating..."
                    ) : (
                      <>
                        Click to create suggested category:{" "}
                        <span className="font-bold">{suggestedCategory}</span>
                      </>
                    )}
                  </button>
                )}

                <div className="form-control relative" ref={brandWrapperRef}>
                  <label className="label font-bold text-sm">Brand</label>
                  <div
                    onClick={() => setBrandOpen(!brandOpen)}
                    className="input input-bordered w-full rounded-lg flex items-center justify-between cursor-pointer"
                  >
                    <span
                      className={
                        form.watch("brandId")
                          ? "text-base-content"
                          : "text-base-content/40"
                      }
                    >
                      {brands.find((b) => b.id === form.watch("brandId"))
                        ?.name || "Select Brand (Optional)"}
                    </span>
                    <ChevronDown size={16} className="opacity-50" />
                  </div>

                  {brandOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-200 rounded-xl shadow-xl z-50 p-2">
                      <div className="relative mb-2">
                        <Search
                          size={14}
                          className="absolute left-3 top-3 opacity-50"
                        />
                        <input
                          value={brandSearch}
                          onKeyDown={handleKeyDown}
                          onChange={(e) => setBrandSearch(e.target.value)}
                          placeholder="Search..."
                          className="input input-sm input-bordered w-full pl-9 rounded-lg"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            form.setValue("brandId", null as any, {
                              shouldDirty: true,
                            });
                            setBrandOpen(false);
                            setSuggestedBrand(null);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-base-200 flex justify-between items-center ${!form.watch("brandId") ? "bg-base-200 font-bold" : "opacity-60"}`}
                        >
                          None (Clear Brand)
                          {!form.watch("brandId") && <Check size={14} />}
                        </button>
                        <div className="divider my-0"></div>

                        {filteredBrands.map((brand) => (
                          <button
                            key={brand.id}
                            type="button"
                            onClick={() => {
                              form.setValue("brandId", brand.id);
                              setBrandOpen(false);
                              setSuggestedBrand(null);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-base-200 flex justify-between items-center ${form.watch("brandId") === brand.id ? "bg-primary/10 text-primary font-bold" : ""}`}
                          >
                            {brand.name}
                            {form.watch("brandId") === brand.id && (
                              <Check size={14} />
                            )}
                          </button>
                        ))}

                        {brandSearch.trim() !== "" &&
                          !brands.some(
                            (b) =>
                              b.name.toLowerCase() ===
                              brandSearch.trim().toLowerCase(),
                          ) && (
                            <button
                              type="button"
                              disabled={isCreatingBrand}
                              onClick={() =>
                                handleQuickCreateBrand(brandSearch.trim())
                              }
                              className="w-full text-left px-3 py-2 rounded-lg text-sm bg-primary/5 hover:bg-primary/10 text-primary font-bold flex justify-between items-center transition-colors mt-2"
                            >
                              <span>+ Create "{brandSearch.trim()}"</span>
                              {isCreatingBrand && (
                                <Loader2 size={14} className="animate-spin" />
                              )}
                            </button>
                          )}
                      </div>
                    </div>
                  )}
                </div>

                {suggestedBrand && !form.watch("brandId") && (
                  <button
                    type="button"
                    disabled={isCreatingBrand}
                    onClick={() => handleQuickCreateBrand(suggestedBrand)}
                    className="w-full text-left text-xs text-secondary mt-2 flex items-center gap-1 hover:underline cursor-pointer animate-in fade-in"
                  >
                    <Sparkles size={12} />
                    {isCreatingBrand ? (
                      "Creating..."
                    ) : (
                      <>
                        Click to create suggested brand:{" "}
                        <span className="font-bold">{suggestedBrand}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-6">
                <h2 className="text-lg font-bold mb-4">Visibility</h2>
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3 p-0 hover:opacity-80 transition-opacity">
                    <input
                      type="checkbox"
                      {...form.register("isFeatured")}
                      className="toggle toggle-primary toggle-sm"
                    />
                    <span className="label-text font-medium">
                      Featured Product
                    </span>
                  </label>
                </div>
                <div className="divider my-2"></div>
                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3 p-0 hover:opacity-80 transition-opacity">
                    <input
                      type="checkbox"
                      {...form.register("isArchived")}
                      className="toggle toggle-error toggle-sm"
                    />
                    <span className="label-text font-medium">Archived</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* ✅ WORDPRESS STYLE MEDIA MANAGER MODAL */}
      {mediaModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border border-base-200 overflow-hidden">
            <div className="p-6 border-b border-base-200 flex justify-between items-center bg-base-200/50">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <ImageIcon size={20} /> Media Manager
              </h3>
              <button
                type="button"
                onClick={() => setMediaModal({ isOpen: false, index: null })}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div
                {...getMediaRootProps()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isMediaDragActive ? "border-primary bg-primary/5 scale-[1.01]" : "border-base-300 hover:border-primary/50"}`}
              >
                <input {...getMediaInputProps()} />
                <UploadCloud size={32} className="mx-auto mb-2 opacity-50" />
                <p className="font-bold text-sm">Upload New Image</p>
                <p className="text-xs opacity-50 mt-1">
                  Drag and drop or click to browse
                </p>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-3 opacity-60 uppercase tracking-wider">
                  Select from Gallery
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                  {form.watch("images")?.map((img, i) => (
                    <div
                      key={i}
                      onClick={() => selectImageForVariant(img)}
                      className="aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary transition-all relative group bg-base-200"
                    >
                      <img
                        src={img}
                        alt="Gallery"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-primary/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold backdrop-blur-[1px]">
                        Select
                      </div>
                    </div>
                  ))}
                  {(!form.watch("images") ||
                    form.watch("images").length === 0) && (
                      <div className="col-span-full text-center py-8 opacity-50 border border-dashed rounded-xl border-base-300">
                        No images uploaded yet.
                      </div>
                    )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-base-200 bg-base-200/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <label className="cursor-pointer label gap-3 bg-base-100 px-4 py-2 rounded-xl shadow-sm border border-base-200">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={applyToSimilar}
                  onChange={(e) => setApplyToSimilar(e.target.checked)}
                />
                <span className="label-text font-bold text-sm flex items-center gap-2">
                  <CheckSquare size={16} className="text-primary" /> Apply to
                  all variants with same color
                </span>
              </label>
              <button
                type="button"
                onClick={() => setMediaModal({ isOpen: false, index: null })}
                className="btn btn-outline"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
