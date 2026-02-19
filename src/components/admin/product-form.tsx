"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProductFormSchema,
  ProductFormValues,
} from "@/lib/validators/product-schema";
import { upsertProduct } from "@/actions/product-upsert";
import { createQuickCategory, createQuickBrand } from "@/actions/quick-create";
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
  Boxes,
  FileText,
  Star,
  ChevronDown,
  Search,
  Check,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";

// Interface matching the hierarchy data from the server page
interface CategoryOption {
  id: string;
  name: string; // "Parent > Child"
  originalName: string; // "Child" (Used for smart matching)
}

interface ProductFormProps {
  initialData?: any;
  categories: CategoryOption[];
  brands: { id: string; name: string }[];
}

export default function ProductForm({
  initialData,
  categories: initialCategories,
  brands: initialBrands,
}: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Local state for dynamic lists (to support quick creation)
  const [categories, setCategories] = useState(initialCategories);
  const [brands, setBrands] = useState(initialBrands);

  // Custom Select States
  const [catOpen, setCatOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");

  // Quick Create States
  const [newCatName, setNewCatName] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);
  const [autoSelected, setAutoSelected] = useState(false);

  // Refs for click outside
  const catWrapperRef = useRef<HTMLDivElement>(null);
  const brandWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      }))
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
    },
  });

  // ✅ FIX 1: Cast 'name' to 'any' to bypass strict object-array check for simple string array
  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({
    control: form.control,
    name: "images" as any,
  });

  const {
    fields: specFields,
    append: appendSpec,
    remove: removeSpec,
  } = useFieldArray({
    control: form.control,
    name: "specs",
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control: form.control,
    name: "variants",
  });

  // --- DROPZONE LOGIC ---
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const binaryStr = reader.result;
          if (typeof binaryStr === "string") {
            // ✅ FIX 2: Cast to 'any' because append logic got inferred from variants/specs types
            appendImage(binaryStr as any);
          }
        };
        reader.readAsDataURL(file);
      });
    },
    [appendImage],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
  });

  // --- SMART SUGGESTION LOGIC ---
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);

    // Auto-generate slug
    if (!initialData) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      form.setValue("slug", slug);

      // 🧠 Smart Category Pre-selection
      // Only if category isn't manually set yet
      if (!form.getValues("categoryId")) {
        const lowerName = name.toLowerCase();
        const match = categories.find(
          (c) =>
            lowerName.includes(c.originalName?.toLowerCase() || "") ||
            (c.originalName &&
              c.originalName.toLowerCase().includes(lowerName)),
        );

        if (match && name.length > 3) {
          form.setValue("categoryId", match.id);
          setAutoSelected(true);
          // Clear "auto" badge after 3 seconds
          setTimeout(() => setAutoSelected(false), 3000);
        }
      }
    }
  };

  // --- HANDLERS ---
  const handleCreateCategory = async (name: string) => {
    if (!name.trim()) return;
    setIsCreatingCat(true);
    const res = await createQuickCategory(name);
    setIsCreatingCat(false);
    if (res.success && res.data) {
      const newCat: CategoryOption = {
        id: res.data.id,
        name: res.data.name,
        originalName: res.data.name,
      };
      setCategories([...categories, newCat]);
      form.setValue("categoryId", res.data.id);
      setCatSearch("");
      setCatOpen(false);
      toast.success(`Category created`);
    } else {
      toast.error("Failed to create category");
    }
  };

  const handleCreateBrand = async (name: string) => {
    if (!name.trim()) return;
    setIsCreatingBrand(true);
    const res = await createQuickBrand(name);
    setIsCreatingBrand(false);
    if (res.success && res.data) {
      setBrands([...brands, res.data]);
      form.setValue("brandId", res.data.id);
      setBrandSearch("");
      setBrandOpen(false);
      toast.success(`Brand created`);
    } else {
      toast.error("Failed to create brand");
    }
  };

  const onSubmit = (data: ProductFormValues) => {
    // Sanitize data before sending to server
    const sanitizedData = {
      ...data,
      brandId: data.brandId === "" ? null : data.brandId,
      price: Number(data.price),
      stock: Number(data.stock),
      discountPrice: data.discountPrice ? Number(data.discountPrice) : null,
    };

    startTransition(async () => {
      // @ts-ignore - Allow sanitized structure to pass through
      const result = await upsertProduct(sanitizedData, initialData?.id);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Product saved successfully");
        router.push("/dashboard/products");
        router.refresh();
      }
    });
  };

  // Filtered Lists
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase()),
  );
  const filteredBrands = brands.filter((b) =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase()),
  );

  // ✅ New Handler: Add Variant with Inheritance
  const handleAddVariant = () => {
    // Get current values from the main form
    const currentPrice = form.getValues("price") || 0;
    const currentStock = form.getValues("stock") || 0;

    // Append new variant pre-filled with these values
    appendVariant({
      name: "",
      sku: "",
      price: currentPrice, // 👈 Pre-filled
      stock: currentStock, // 👈 Pre-filled
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-8 max-w-6xl mx-auto pb-20"
    >
      {/* Sticky Header */}
      <div className="flex items-center justify-between sticky top-0 z-20 bg-base-200/80 backdrop-blur-md py-4 -mx-4 px-4 border-b border-base-content/5">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products" className="btn btn-circle btn-ghost">
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
        {/* --- LEFT COLUMN: Content --- */}
        <div className="lg:col-span-2 space-y-6">
          {/* General Info */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-base-content/5">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Basic Information</h2>
                  <p className="text-xs opacity-60">
                    Title, URL, and description of your product.
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="form-control">
                    <label className="label font-medium text-sm text-base-content/80">
                      Product Name <span className="text-error">*</span>
                    </label>
                    <input
                      {...form.register("name")}
                      onChange={handleNameChange}
                      className="input input-bordered w-full rounded-lg focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                      placeholder="e.g. Premium Leather Jacket"
                    />
                    {form.formState.errors.name && (
                      <span className="text-error text-xs mt-1">
                        {form.formState.errors.name.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control">
                    <label className="label font-medium text-sm text-base-content/80">
                      Slug (URL) <span className="text-error">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs text-base-content/40 font-mono select-none">
                        /product/
                      </span>
                      <input
                        {...form.register("slug")}
                        className="input input-bordered w-full rounded-lg pl-16 font-mono text-sm focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                        placeholder="premium-leather-jacket"
                      />
                    </div>
                    {form.formState.errors.slug && (
                      <span className="text-error text-xs mt-1">
                        {form.formState.errors.slug.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-control">
                  <label className="label font-medium text-sm text-base-content/80">
                    Description
                  </label>
                  <textarea
                    {...form.register("description")}
                    className="textarea textarea-bordered h-48 rounded-xl text-base leading-relaxed p-4 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-y"
                    placeholder="Write a detailed description of your product..."
                  />
                  <div className="label">
                    <span className="label-text-alt text-base-content/50">
                      Markdown supported
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Variants Section */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                  Product Variants
                </h2>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="btn btn-xs btn-ghost gap-1"
                >
                  <Plus size={14} /> Add Variant
                </button>
              </div>

              <div className="space-y-4">
                {variantFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start bg-base-200/30 p-3 rounded-xl border border-base-200"
                  >
                    <div className="md:col-span-3">
                      <input
                        {...form.register(`variants.${index}.name`)}
                        placeholder="Name (e.g. Red / XL)"
                        className="input input-sm input-bordered w-full"
                      />
                      {form.formState.errors.variants?.[index]?.name && (
                        <span className="text-error text-xs">
                          {form.formState.errors.variants[index]?.name?.message}
                        </span>
                      )}
                    </div>
                    <div className="md:col-span-3">
                      <input
                        {...form.register(`variants.${index}.sku`)}
                        placeholder="SKU"
                        className="input input-sm input-bordered w-full"
                      />
                      {form.formState.errors.variants?.[index]?.sku && (
                        <span className="text-error text-xs">
                          {form.formState.errors.variants[index]?.sku?.message}
                        </span>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <input
                        type="number"
                        {...form.register(`variants.${index}.price`)}
                        placeholder="Price"
                        className="input input-sm input-bordered w-full"
                      />
                      {form.formState.errors.variants?.[index]?.price && (
                        <span className="text-error text-xs">
                          {
                            form.formState.errors.variants[index]?.price
                              ?.message
                          }
                        </span>
                      )}
                    </div>
                    <div className="md:col-span-2">
                      <input
                        type="number"
                        {...form.register(`variants.${index}.stock`)}
                        placeholder="Stock"
                        className="input input-sm input-bordered w-full"
                      />
                      {form.formState.errors.variants?.[index]?.stock && (
                        <span className="text-error text-xs">
                          {
                            form.formState.errors.variants[index]?.stock
                              ?.message
                          }
                        </span>
                      )}
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="btn btn-sm btn-square btn-ghost text-error"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {variantFields.length === 0 && (
                  <div className="text-center py-6 bg-base-200/50 rounded-xl border border-dashed border-base-300">
                    <Boxes className="mx-auto h-8 w-8 text-base-content/20 mb-2" />
                    <p className="text-sm text-base-content/60">
                      No variants added.
                    </p>
                    <p className="text-xs text-base-content/40">
                      Add variants if this product has options like Size or
                      Color.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Specifications */}
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
                  <div key={field.id} className="flex gap-2 items-start group">
                    <div className="flex-1">
                      <input
                        {...form.register(`specs.${index}.name`)}
                        placeholder="Attribute (e.g. Material)"
                        className="input input-sm input-bordered w-full"
                      />
                      {form.formState.errors.specs?.[index]?.name && (
                        <span className="text-error text-xs">
                          {form.formState.errors.specs[index]?.name?.message}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        {...form.register(`specs.${index}.value`)}
                        placeholder="Value (e.g. Cotton)"
                        className="input input-sm input-bordered w-full"
                      />
                      {form.formState.errors.specs?.[index]?.value && (
                        <span className="text-error text-xs">
                          {form.formState.errors.specs[index]?.value?.message}
                        </span>
                      )}
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
                {specFields.length === 0 && (
                  <p className="text-sm text-base-content/40 text-center py-4 bg-base-200/50 rounded-xl border border-dashed border-base-300">
                    No specifications added yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="card bg-base-100 shadow-sm border border-base-200 overflow-visible">
            <div className="card-body p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-accent rounded-full"></span>
                Gallery
              </h2>
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
                      Click or drag images here
                    </p>
                    <p className="text-sm opacity-50">
                      Supports JPG, PNG, WEBP
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

                        {/* Featured Image Badge */}
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
        </div>

        {/* --- RIGHT COLUMN: Organization --- */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full"></span>
                Pricing & Inventory
              </h2>
              <div className="grid grid-cols-1 gap-4">
                <div className="form-control">
                  <label className="label font-bold text-sm">Base Price</label>
                  <label className="input input-bordered flex items-center gap-2">
                    <span className="opacity-50">Rs.</span>
                    <input
                      type="number"
                      {...form.register("price")}
                      className="grow"
                      placeholder="0.00"
                      min="0"
                    />
                  </label>
                  {form.formState.errors.price && (
                    <span className="text-error text-xs mt-1">
                      {form.formState.errors.price.message}
                    </span>
                  )}
                </div>
                <div className="form-control">
                  <label className="label font-bold text-sm">
                    Discount Price
                  </label>
                  <label className="input input-bordered flex items-center gap-2">
                    <span className="opacity-50">Rs.</span>
                    <input
                      type="number"
                      {...form.register("discountPrice")}
                      className="grow"
                      placeholder="Optional"
                      min="0"
                    />
                  </label>
                </div>
                <div className="form-control">
                  <label className="label font-bold text-sm">Base Stock</label>
                  <input
                    type="number"
                    {...form.register("stock")}
                    className="input input-bordered"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Organization Card */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <h2 className="text-lg font-bold mb-4">Organization</h2>

              {/* Category Select + Quick Create */}
              <div className="form-control mb-6 relative" ref={catWrapperRef}>
                <label className="label font-bold text-sm">
                  Category
                  {autoSelected && (
                    <span className="badge badge-accent badge-xs gap-1 animate-pulse">
                      <Sparkles size={10} /> Auto-selected
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
                        onChange={(e) => setCatSearch(e.target.value)}
                        placeholder="Search or create..."
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
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-base-200 flex justify-between items-center ${form.watch("categoryId") === cat.id ? "bg-primary/10 text-primary font-bold" : ""}`}
                        >
                          {cat.name}
                          {form.watch("categoryId") === cat.id && (
                            <Check size={14} />
                          )}
                        </button>
                      ))}
                      {filteredCategories.length === 0 && catSearch && (
                        <button
                          type="button"
                          onClick={() => handleCreateCategory(catSearch)}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm bg-primary/5 text-primary hover:bg-primary/10 font-bold flex items-center gap-2"
                        >
                          <Plus size={14} /> Create "{catSearch}"
                        </button>
                      )}
                    </div>
                  </div>
                )}
                {form.formState.errors.categoryId && (
                  <span className="text-error text-xs mt-1">
                    {form.formState.errors.categoryId.message}
                  </span>
                )}
              </div>

              {/* Brand Select + Quick Create */}
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
                    {brands.find((b) => b.id === form.watch("brandId"))?.name ||
                      "Select Brand"}
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
                        autoFocus
                        value={brandSearch}
                        onChange={(e) => setBrandSearch(e.target.value)}
                        placeholder="Search or create..."
                        className="input input-sm input-bordered w-full pl-9 rounded-lg"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filteredBrands.map((brand) => (
                        <button
                          key={brand.id}
                          type="button"
                          onClick={() => {
                            form.setValue("brandId", brand.id);
                            setBrandOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-base-200 flex justify-between items-center ${form.watch("brandId") === brand.id ? "bg-primary/10 text-primary font-bold" : ""}`}
                        >
                          {brand.name}
                          {form.watch("brandId") === brand.id && (
                            <Check size={14} />
                          )}
                        </button>
                      ))}
                      {filteredBrands.length === 0 && brandSearch && (
                        <button
                          type="button"
                          onClick={() => handleCreateBrand(brandSearch)}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm bg-primary/5 text-primary hover:bg-primary/10 font-bold flex items-center gap-2"
                        >
                          <Plus size={14} /> Create "{brandSearch}"
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Visibility Card */}
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
                <p className="text-xs opacity-50 mt-1 pl-10">
                  Show on homepage and top lists.
                </p>
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
                <p className="text-xs opacity-50 mt-1 pl-10">
                  Hide from shop without deleting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
