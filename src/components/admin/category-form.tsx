"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CategoryFormSchema,
  CategoryFormValues,
} from "@/lib/validators/category-schema";
import { upsertCategory } from "@/actions/categories";
import { useRouter } from "next/navigation";
import { useState, useTransition, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Save,
  ArrowLeft,
  Image as ImageIcon,
  UploadCloud,
  X,
  Trash2,
  FileText,
  Layers,
} from "lucide-react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import Image from "next/image";

interface CategoryFormProps {
  initialData?: any;
  categories: { id: string; name: string }[]; // For parent selection
}

export default function CategoryForm({
  initialData,
  categories,
}: CategoryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(CategoryFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || "",
      parentId: initialData?.parentId || "",
      image: initialData?.image || "",
    },
  });

  // --- DROPZONE LOGIC ---
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const binaryStr = reader.result;
        if (typeof binaryStr === "string") {
          form.setValue("image", binaryStr, {
            shouldDirty: true,
            shouldValidate: true,
          });
        }
      };
      reader.readAsDataURL(file);
    },
    [form],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    multiple: false,
  });

  // --- HANDLERS ---
  const onSubmit = (data: CategoryFormValues) => {
    startTransition(async () => {
      const result = await upsertCategory(data, initialData?.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Category saved successfully");
        router.push("/dashboard/categories");
        router.refresh();
      }
    });
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);
    if (!initialData) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      form.setValue("slug", slug);
    }
  };

  const currentImage = form.watch("image");

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-8 max-w-5xl mx-auto pb-20"
    >
      {/* Sticky Header */}
      <div className="flex items-center justify-between sticky top-0 z-20 bg-base-200/80 backdrop-blur-md py-4 -mx-4 px-4 border-b border-base-content/5">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/categories"
            className="btn btn-circle btn-ghost"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              {initialData ? "Edit Category" : "New Category"}
            </h1>
            <p className="text-sm opacity-60">Organize your products</p>
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
          Save Category
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- LEFT COLUMN: Main Info --- */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-base-content/5">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Basic Information</h2>
                  <p className="text-xs opacity-60">Naming and hierarchy.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="form-control">
                  <label className="label font-bold text-sm">
                    Category Name
                  </label>
                  <input
                    {...form.register("name")}
                    onChange={handleNameChange}
                    className="input input-bordered w-full rounded-lg focus:border-primary"
                    placeholder="e.g. Smartphones"
                  />
                  {form.formState.errors.name && (
                    <span className="text-error text-xs mt-1">
                      {form.formState.errors.name.message}
                    </span>
                  )}
                </div>

                <div className="form-control">
                  <label className="label font-bold text-sm">Slug</label>
                  <div className="join w-full">
                    <span className="join-item btn btn-active btn-sm no-animation font-normal text-xs px-2 h-12 bg-base-200 border-base-300">
                      /category/
                    </span>
                    <input
                      {...form.register("slug")}
                      className="input input-bordered w-full join-item font-mono text-sm"
                      placeholder="smartphones"
                    />
                  </div>
                  {form.formState.errors.slug && (
                    <span className="text-error text-xs mt-1">
                      {form.formState.errors.slug.message}
                    </span>
                  )}
                </div>

                <div className="form-control">
                  <label className="label font-bold text-sm">
                    Parent Category
                  </label>
                  <select
                    {...form.register("parentId")}
                    className="select select-bordered w-full rounded-lg"
                  >
                    <option value="">None (Top Level)</option>
                    {categories.map((c) => (
                      <option
                        key={c.id}
                        value={c.id}
                        disabled={c.id === initialData?.id}
                      >
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <label className="label">
                    <span className="label-text-alt text-base-content/50">
                      Nest this category under another to create sub-menus.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: Image --- */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-base-content/5">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Cover Image</h2>
                  <p className="text-xs opacity-60">Visual representation.</p>
                </div>
              </div>

              {/* Dropzone Area */}
              <div
                {...getRootProps()}
                className={`relative aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all overflow-hidden ${
                  isDragActive
                    ? "border-primary bg-primary/5 scale-[1.01]"
                    : "border-base-300 hover:border-primary/50 hover:bg-base-200/50"
                }`}
              >
                <input {...getInputProps()} />

                {currentImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentImage}
                      alt="Category Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-white font-bold flex items-center gap-2">
                        <UploadCloud size={20} /> Change
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="p-6">
                    <div className="bg-base-200 p-4 rounded-full inline-flex mb-3">
                      <Layers className="h-8 w-8 text-base-content/30" />
                    </div>
                    <p className="font-bold text-sm">Click to upload</p>
                    <p className="text-xs text-base-content/50 mt-1">
                      or drag and drop
                    </p>
                  </div>
                )}
              </div>

              {/* Remove Button */}
              {currentImage && (
                <button
                  type="button"
                  onClick={() =>
                    form.setValue("image", "", { shouldDirty: true })
                  }
                  className="btn btn-outline btn-error btn-sm w-full mt-4 gap-2"
                >
                  <Trash2 size={16} /> Remove Image
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
