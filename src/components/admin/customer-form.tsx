"use client";

import { useForm, useFieldArray, useWatch, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CustomerFormSchema,
  CustomerFormValues,
} from "@/lib/validators/customer-schema";
import { upsertCustomer } from "@/actions/customer-actions";
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
  MapPin,
  Plus,
  Trash2,
  Image as ImageIcon,
  UploadCloud,
  Check,
} from "lucide-react";
import Link from "next/link";
import { useDropzone } from "react-dropzone";
import COUNTRY_CODES from "../ui/country-code";

const NEPAL_LOCATIONS: Record<string, string[]> = {
  Koshi: [
    "Bhojpur",
    "Dhankuta",
    "Ilam",
    "Jhapa",
    "Khotang",
    "Morang",
    "Okhaldhunga",
    "Panchthar",
    "Sankhuwasabha",
    "Solukhumbu",
    "Sunsari",
    "Taplejung",
    "Terhathum",
    "Udayapur",
  ],
  Madhesh: [
    "Bara",
    "Dhanusha",
    "Mahottari",
    "Parsa",
    "Rautahat",
    "Saptari",
    "Sarlahi",
    "Siraha",
  ],
  Bagmati: [
    "Bhaktapur",
    "Chitwan",
    "Dhading",
    "Dolakha",
    "Kathmandu",
    "Kavrepalanchok",
    "Lalitpur",
    "Makwanpur",
    "Nuwakot",
    "Ramechhap",
    "Rasuwa",
    "Sindhuli",
    "Sindhupalchok",
  ],
  Gandaki: [
    "Baglung",
    "Gorkha",
    "Kaski",
    "Lamjung",
    "Manang",
    "Mustang",
    "Myagdi",
    "Nawalpur",
    "Parbat",
    "Syangja",
    "Tanahun",
  ],
  Lumbini: [
    "Arghakhanchi",
    "Banke",
    "Bardiya",
    "Dang",
    "Gulmi",
    "Kapilvastu",
    "Parasi",
    "Palpa",
    "Pyuthan",
    "Rolpa",
    "Rukum East",
    "Rupandehi",
  ],
  Karnali: [
    "Dailekh",
    "Dolpa",
    "Humla",
    "Jajarkot",
    "Jumla",
    "Kalikot",
    "Mugu",
    "Salyan",
    "Surkhet",
    "Rukum West",
  ],
  Sudurpashchim: [
    "Achham",
    "Baitadi",
    "Bajhang",
    "Bajura",
    "Dadeldhura",
    "Darchula",
    "Doti",
    "Kailali",
    "Kanchanpur",
  ],
};

interface CustomerFormProps {
  initialData?: any;
}

// --- SUB-COMPONENT FOR ADDRESS ROW (Handles Cascading Logic) ---
const AddressRow = ({
  control,
  index,
  remove,
  handleSetDefault,
  register,
  errors,
  isDefault,
}: {
  control: Control<CustomerFormValues>;
  index: number;
  remove: (index: number) => void;
  handleSetDefault: (index: number) => void;
  register: any;
  errors: any;
  isDefault: boolean;
}) => {
  // Watch province to update districts dynamically
  const province = useWatch({
    control,
    name: `addresses.${index}.province`,
  });

  const districts = province ? NEPAL_LOCATIONS[province] || [] : [];

  return (
    <div
      className={`relative p-5 rounded-xl border-2 transition-all ${isDefault ? "border-primary bg-primary/5" : "border-base-200 bg-base-50"}`}
    >
      <div className="absolute top-4 right-4 flex gap-2">
        <button
          type="button"
          onClick={() => handleSetDefault(index)}
          className={`btn btn-xs ${isDefault ? "btn-primary" : "btn-ghost"}`}
        >
          {isDefault ? (
            <>
              <Check size={12} /> Default
            </>
          ) : (
            "Set Default"
          )}
        </button>
        <button
          type="button"
          onClick={() => remove(index)}
          className="btn btn-xs btn-square btn-ghost text-error"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 pr-0 md:pr-24">
        {/* Province & District */}
        <div className="form-control">
          <label className="label text-xs opacity-60 pb-1 font-bold">
            Province <span className="text-error">*</span>
          </label>
          <select
            {...register(`addresses.${index}.province`)}
            className="select select-bordered select-sm w-full rounded-lg"
          >
            <option value="">Select Province</option>
            {Object.keys(NEPAL_LOCATIONS).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {errors?.province && (
            <span className="text-error text-xs mt-1">
              {errors.province.message}
            </span>
          )}
        </div>

        <div className="form-control">
          <label className="label text-xs opacity-60 pb-1 font-bold">
            District <span className="text-error">*</span>
          </label>
          <select
            {...register(`addresses.${index}.district`)}
            className="select select-bordered select-sm w-full rounded-lg"
            disabled={!province}
          >
            <option value="">
              {province ? "Select District" : "Select Province First"}
            </option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {errors?.district && (
            <span className="text-error text-xs mt-1">
              {errors.district.message}
            </span>
          )}
        </div>

        {/* Municipality & Ward */}
        <div className="form-control">
          <label className="label text-xs opacity-60 pb-1 font-bold">
            Municipality / VDC <span className="text-error">*</span>
          </label>
          <input
            {...register(`addresses.${index}.city`)}
            className="input input-bordered input-sm w-full rounded-lg"
            placeholder="e.g. Kathmandu Metro"
          />
          {errors?.city && (
            <span className="text-error text-xs mt-1">
              {errors.city.message}
            </span>
          )}
        </div>

        <div className="form-control">
          <label className="label text-xs opacity-60 pb-1 font-bold">
            Ward No <span className="text-error">*</span>
          </label>
          <input
            type="number"
            {...register(`addresses.${index}.ward`)}
            className="input input-bordered input-sm w-full rounded-lg"
            placeholder="e.g. 10"
          />
          {errors?.ward && (
            <span className="text-error text-xs mt-1">
              {errors.ward.message}
            </span>
          )}
        </div>

        {/* Street & Postal */}
        <div className="form-control md:col-span-2">
          <label className="label text-xs opacity-60 pb-1 font-bold">
            House No / Tole / Street <span className="text-error">*</span>
          </label>
          <input
            {...register(`addresses.${index}.street`)}
            className="input input-bordered input-sm w-full rounded-lg"
            placeholder="e.g. House 123, New Road"
          />
          {errors?.street && (
            <span className="text-error text-xs mt-1">
              {errors.street.message}
            </span>
          )}
        </div>

        <div className="form-control">
          <label className="label text-xs opacity-60 pb-1 font-bold">
            Postal Code
          </label>
          <input
            {...register(`addresses.${index}.postalCode`)}
            className="input input-bordered input-sm w-full rounded-lg"
            placeholder="e.g. 44600"
          />
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
export default function CustomerForm({ initialData }: CustomerFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [countryCode, setCountryCode] = useState("+977");

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(CustomerFormSchema) as any,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      image: "",
      password: "",
      addresses: [],
    },
  });

  // Force reset when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        image: initialData.image || "",
        password: "",
        addresses: initialData.addresses || [],
      });
    }
  }, [initialData, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "addresses",
  });

  // --- DROPZONE ---
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

  // --- HANDLERS ---
  const handleSetDefault = (index: number) => {
    const currentAddresses = form.getValues("addresses") || [];
    const updated = currentAddresses.map((addr, i) => ({
      ...addr,
      isDefault: i === index,
    }));
    form.setValue("addresses", updated, { shouldDirty: true });
  };

  const onSubmit = (data: CustomerFormValues) => {
    startTransition(async () => {
      const result = await upsertCustomer(data, initialData?.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success as string);
        router.push("/dashboard/customers");
        router.refresh();
      }
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-8 max-w-5xl mx-auto pb-20"
    >
      {/* Sticky Header */}
      <div className="flex items-center justify-between sticky top-0 z-20 bg-base-200/80 backdrop-blur-md py-4 -mx-4 px-4 border-b border-base-content/5">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/customers"
            className="btn btn-circle btn-ghost"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              {initialData ? "Edit Customer" : "New Customer"}
            </h1>
            <p className="text-sm opacity-60">
              Manage customer profile and addresses
            </p>
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
          Save Customer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COL - Basic Info & Addresses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Basic Info */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <User size={20} className="text-primary" /> Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      placeholder="John Doe"
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
                    Phone Number <span className="text-error">*</span>
                  </label>
                  <div className="join w-full">
                    <select
                      className="select select-bordered join-item px-2 min-w-[100px]"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                    >
                      {COUNTRY_CODES.map((country) => (
                        <option key={country.flag} value={country.code}>
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
                    <input
                      {...form.register("phone", {
                        required: "Phone number is required",
                      })}
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
                    Email <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-3 opacity-30"
                      size={18}
                    />
                    <input
                      {...form.register("email")}
                      placeholder="john@example.com"
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
                        initialData ? "Leave blank to keep" : "Set password"
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

          {/* Card: Addresses */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <MapPin size={20} className="text-secondary" /> Delivery
                  Addresses
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    append({
                      province: "",
                      district: "",
                      city: "",
                      street: "",
                      ward: 0,
                      postalCode: "",
                      phone: "",
                      isDefault: fields.length === 0,
                    })
                  }
                  className="btn btn-sm btn-ghost gap-1 text-primary"
                >
                  <Plus size={16} /> Add Address
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <AddressRow
                    key={field.id}
                    control={form.control}
                    index={index}
                    remove={remove}
                    handleSetDefault={handleSetDefault}
                    register={form.register}
                    errors={form.formState.errors.addresses?.[index]}
                    isDefault={
                      form.watch(`addresses.${index}.isDefault`) || false
                    }
                  />
                ))}
                {fields.length === 0 && (
                  <div className="text-center py-8 opacity-50 border-2 border-dashed border-base-200 rounded-xl">
                    <MapPin className="mx-auto mb-2 opacity-50" />
                    <p>No addresses added yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COL - Profile Image */}
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
