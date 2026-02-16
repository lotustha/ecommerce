"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  StaffFormSchema,
  StaffFormValues,
} from "@/lib/validators/staff-schema";
import { upsertStaff } from "@/actions/staff-actions";
import { useRouter } from "next/navigation";
import { useState, useTransition, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Save,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  Image as ImageIcon,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";

const COUNTRY_CODES = [
  { code: "+977", flag: "🇳🇵" },
  { code: "+1", flag: "🇺🇸" },
  { code: "+91", flag: "🇮🇳" },
  { code: "+86", flag: "🇨🇳" },
  { code: "+44", flag: "🇬🇧" },
];

interface StaffFormProps {
  initialData?: any;
}

export default function StaffForm({ initialData }: StaffFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [countryCode, setCountryCode] = useState("+977");

  const form = useForm<StaffFormValues>({
    resolver: zodResolver(StaffFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      role: initialData?.role || "STAFF",
      image: initialData?.image || "",
      password: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        role: initialData.role || "STAFF",
        image: initialData.image || "",
        password: "",
      });
    }
  }, [initialData, form]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          form.setValue("image", result, { shouldDirty: true });
        };
        reader.readAsDataURL(file);
      }
    },
    [form],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    maxFiles: 1,
    multiple: false,
  });

  const onSubmit = (data: StaffFormValues) => {
    startTransition(async () => {
      const result = await upsertStaff(data, initialData?.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Staff member updated successfully");
        router.push("/dashboard/staff");
        router.refresh();
      }
    });
  };

  const onError = (errors: any) => {
    console.error("Form Errors:", errors);
    toast.error("Please check the form for errors");
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, onError)}
      className="space-y-8 max-w-5xl mx-auto pb-20"
    >
      <div className="flex items-center justify-between sticky top-0 z-20 bg-base-200/80 backdrop-blur-md py-4 -mx-4 px-4 border-b border-base-content/5">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/staff" className="btn btn-circle btn-ghost">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              {initialData ? "Edit Staff" : "New Staff"}
            </h1>
            <p className="text-sm opacity-60">Manage employee permissions</p>
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
          Save Staff
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6 space-y-6">
              <div className="form-control">
                <label className="label font-bold text-sm">
                  Full Name <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-3 opacity-30"
                    size={18}
                  />
                  <input
                    {...form.register("name")}
                    placeholder="Jane Admin"
                    className="input input-bordered rounded-lg pl-10 w-full"
                  />
                </div>
                {form.formState.errors.name && (
                  <span className="text-error text-xs mt-1">
                    {form.formState.errors.name.message}
                  </span>
                )}
              </div>

              <div className="form-control">
                <label className="label font-bold text-sm">
                  Email Address <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-3 opacity-30"
                    size={18}
                  />
                  <input
                    {...form.register("email")}
                    placeholder="jane@nepalecom.com"
                    className="input input-bordered rounded-lg pl-10 w-full"
                  />
                </div>
                {form.formState.errors.email && (
                  <span className="text-error text-xs mt-1">
                    {form.formState.errors.email.message}
                  </span>
                )}
              </div>

              <div className="form-control">
                <label className="label font-bold text-sm">
                  Phone Number <span className="text-error">*</span>
                </label>
                <div className="join w-full">
                  <select
                    className="select select-bordered join-item px-2 min-w-[80px]"
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                  >
                    {COUNTRY_CODES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.flag} {country.code}
                      </option>
                    ))}
                  </select>
                  <input
                    {...form.register("phone")}
                    placeholder="9800000000"
                    className="input input-bordered join-item w-full"
                  />
                </div>
                {form.formState.errors.phone && (
                  <span className="text-error text-xs mt-1">
                    {form.formState.errors.phone.message}
                  </span>
                )}
              </div>

              <div className="form-control">
                <label className="label font-bold text-sm">
                  Role <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <ShieldCheck
                    className="absolute left-3 top-3 opacity-30"
                    size={18}
                  />
                  <select
                    {...form.register("role")}
                    className="select select-bordered w-full rounded-lg pl-10"
                  >
                    <option value="STAFF">Staff (General)</option>
                    <option value="RIDER">Delivery Rider</option>
                    <option value="ADMIN">Administrator (Full Access)</option>
                  </select>
                </div>
                {form.formState.errors.role && (
                  <span className="text-error text-xs mt-1">
                    {form.formState.errors.role.message}
                  </span>
                )}
              </div>

              <div className="form-control">
                <label className="label font-bold text-sm">Password</label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-3 opacity-30"
                    size={18}
                  />
                  <input
                    type="password"
                    {...form.register("password")}
                    placeholder={
                      initialData
                        ? "Leave blank to keep current"
                        : "Set initial password"
                    }
                    className="input input-bordered rounded-lg pl-10 w-full"
                  />
                </div>
                {form.formState.errors.password && (
                  <span className="text-error text-xs mt-1">
                    {form.formState.errors.password.message}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Profile Picture */}
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6 flex flex-col items-center">
              <h2 className="text-lg font-bold mb-4 w-full">Profile Picture</h2>
              <div
                {...getRootProps()}
                className={`relative w-48 h-48 border-2 border-dashed rounded-full flex flex-col items-center justify-center text-center cursor-pointer transition-all overflow-hidden ${
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-base-300 hover:border-primary/50 hover:bg-base-200/50"
                }`}
              >
                <input {...getInputProps()} />
                {form.watch("image") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.watch("image") || ""}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center opacity-40">
                    <ImageIcon size={32} />
                    <span className="text-xs mt-2 font-bold">Upload Photo</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white font-bold gap-2">
                  <UploadCloud size={20} /> Change
                </div>
              </div>

              {form.watch("image") && (
                <button
                  type="button"
                  onClick={() =>
                    form.setValue("image", "", { shouldDirty: true })
                  }
                  className="btn btn-sm btn-ghost text-error mt-4"
                >
                  Remove Photo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
