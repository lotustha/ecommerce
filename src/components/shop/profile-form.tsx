"use client"

import { useForm, useFieldArray, useWatch, Control } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ProfileFormSchema, ProfileFormValues } from "@/lib/validators/profile-schema"
import { updateProfile } from "@/actions/profile-actions"
import { useRouter } from "next/navigation"
import { useState, useTransition, useCallback, useEffect } from "react"
import { toast } from "react-hot-toast"
import { Save, User, Mail, Phone, Lock, MapPin, Plus, Trash2, Image as ImageIcon, UploadCloud, Check } from "lucide-react"
import { useDropzone } from "react-dropzone"

// --- DATA CONSTANTS (Reused for consistency) ---
const NEPAL_LOCATIONS: Record<string, string[]> = {
    "Koshi": ["Bhojpur", "Dhankuta", "Ilam", "Jhapa", "Khotang", "Morang", "Okhaldhunga", "Panchthar", "Sankhuwasabha", "Solukhumbu", "Sunsari", "Taplejung", "Terhathum", "Udayapur"],
    "Madhesh": ["Bara", "Dhanusha", "Mahottari", "Parsa", "Rautahat", "Saptari", "Sarlahi", "Siraha"],
    "Bagmati": ["Bhaktapur", "Chitwan", "Dhading", "Dolakha", "Kathmandu", "Kavrepalanchok", "Lalitpur", "Makwanpur", "Nuwakot", "Ramechhap", "Rasuwa", "Sindhuli", "Sindhupalchok"],
    "Gandaki": ["Baglung", "Gorkha", "Kaski", "Lamjung", "Manang", "Mustang", "Myagdi", "Nawalpur", "Parbat", "Syangja", "Tanahun"],
    "Lumbini": ["Arghakhanchi", "Banke", "Bardiya", "Dang", "Gulmi", "Kapilvastu", "Parasi", "Palpa", "Pyuthan", "Rolpa", "Rukum East", "Rupandehi"],
    "Karnali": ["Dailekh", "Dolpa", "Humla", "Jajarkot", "Jumla", "Kalikot", "Mugu", "Salyan", "Surkhet", "Rukum West"],
    "Sudurpashchim": ["Achham", "Baitadi", "Bajhang", "Bajura", "Dadeldhura", "Darchula", "Doti", "Kailali", "Kanchanpur"],
}

interface ProfileFormProps {
    initialData: any
}

// Sub-component for Address Row to isolate useWatch
const AddressRow = ({ control, index, remove, handleSetDefault, register, errors, isDefault }: any) => {
    const province = useWatch({ control, name: `addresses.${index}.province` })
    const districts = province ? NEPAL_LOCATIONS[province] || [] : []

    return (
        <div className={`relative p-5 rounded-xl border-2 transition-all ${isDefault ? "border-primary bg-primary/5" : "border-base-200 bg-base-50"}`}>
            <div className="absolute top-4 right-4 flex gap-2">
                <button type="button" onClick={() => handleSetDefault(index)} className={`btn btn-xs ${isDefault ? "btn-primary" : "btn-ghost"}`}>
                    {isDefault ? <><Check size={12} /> Default</> : "Set Default"}
                </button>
                <button type="button" onClick={() => remove(index)} className="btn btn-xs btn-square btn-ghost text-error">
                    <Trash2 size={14} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4 pr-0 md:pr-24">
                <div className="form-control">
                    <label className="label text-xs opacity-60 pb-1 font-bold">Province</label>
                    <select {...register(`addresses.${index}.province`)} className="select select-bordered select-sm w-full rounded-lg">
                        <option value="">Select Province</option>
                        {Object.keys(NEPAL_LOCATIONS).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {errors?.province && <span className="text-error text-xs mt-1">{errors.province.message}</span>}
                </div>
                <div className="form-control">
                    <label className="label text-xs opacity-60 pb-1 font-bold">District</label>
                    <select {...register(`addresses.${index}.district`)} className="select select-bordered select-sm w-full rounded-lg" disabled={!province}>
                        <option value="">{province ? "Select District" : "Select Province First"}</option>
                        {districts.map((d: string) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    {errors?.district && <span className="text-error text-xs mt-1">{errors.district.message}</span>}
                </div>
                <div className="form-control">
                    <label className="label text-xs opacity-60 pb-1 font-bold">Municipality</label>
                    <input {...register(`addresses.${index}.city`)} className="input input-bordered input-sm w-full rounded-lg" placeholder="Kathmandu Metro" />
                    {errors?.city && <span className="text-error text-xs mt-1">{errors.city.message}</span>}
                </div>
                <div className="form-control">
                    <label className="label text-xs opacity-60 pb-1 font-bold">Ward No</label>
                    <input type="number" {...register(`addresses.${index}.ward`)} className="input input-bordered input-sm w-full rounded-lg" placeholder="10" />
                    {errors?.ward && <span className="text-error text-xs mt-1">{errors.ward.message}</span>}
                </div>
                <div className="form-control md:col-span-2">
                    <label className="label text-xs opacity-60 pb-1 font-bold">Street / Tole</label>
                    <input {...register(`addresses.${index}.street`)} className="input input-bordered input-sm w-full rounded-lg" placeholder="House 123, New Road" />
                    {errors?.street && <span className="text-error text-xs mt-1">{errors.street.message}</span>}
                </div>
                <div className="form-control">
                    <label className="label text-xs opacity-60 pb-1 font-bold">Postal Code</label>
                    <input {...register(`addresses.${index}.postalCode`)} className="input input-bordered input-sm w-full rounded-lg" placeholder="44600" />
                </div>
                <div className="form-control">
                    <label className="label text-xs opacity-60 pb-1 font-bold">Contact Phone</label>
                    <input {...register(`addresses.${index}.phone`)} className="input input-bordered input-sm w-full rounded-lg" placeholder="If different from main" />
                </div>
            </div>
        </div>
    )
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(ProfileFormSchema) as any,
        defaultValues: {
            name: initialData?.name || "",
            phone: initialData?.phone || "",
            image: initialData?.image || "",
            password: "",
            confirmPassword: "",
            addresses: initialData?.addresses || [],
        }
    })

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "addresses"
    })

    // --- DROPZONE ---
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = () => {
                form.setValue("image", reader.result as string, { shouldDirty: true })
            }
            reader.readAsDataURL(file)
        }
    }, [form])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        maxFiles: 1,
        multiple: false
    })

    const handleSetDefault = (index: number) => {
        const currentAddresses = form.getValues("addresses") || []
        const updated = currentAddresses.map((addr, i) => ({ ...addr, isDefault: i === index }))
        form.setValue("addresses", updated, { shouldDirty: true })
    }

    const onSubmit = (data: ProfileFormValues) => {
        startTransition(async () => {
            const result = await updateProfile(data)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(result.success ?? "Profile updated successfully")
                router.refresh()
            }
        })
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto pb-20">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">My Profile</h1>
                    <p className="text-sm opacity-60">Manage your personal information and addresses</p>
                </div>
                <button type="submit" disabled={isPending} className="btn btn-primary rounded-xl shadow-lg">
                    {isPending ? <span className="loading loading-spinner"></span> : <Save size={18} />}
                    Save Changes
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* LEFT: Profile Pic & Basic Info */}
                <div className="space-y-6">
                    {/* Profile Picture */}
                    <div className="card bg-base-100 shadow-sm border border-base-200">
                        <div className="card-body p-6 flex flex-col items-center">
                            <h2 className="text-lg font-bold mb-4 w-full">Avatar</h2>
                            <div
                                {...getRootProps()}
                                className={`relative w-40 h-40 border-2 border-dashed rounded-full flex flex-col items-center justify-center text-center cursor-pointer transition-all overflow-hidden ${isDragActive ? "border-primary bg-primary/5" : "border-base-300 hover:border-primary/50 hover:bg-base-200/50"
                                    }`}
                            >
                                <input {...getInputProps()} />
                                {form.watch("image") ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={form.watch("image") || ""} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="flex flex-col items-center opacity-40">
                                        <ImageIcon size={32} />
                                        <span className="text-xs mt-2 font-bold">Upload</span>
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white font-bold gap-2">
                                    <UploadCloud size={20} />
                                </div>
                            </div>
                            {form.watch("image") && (
                                <button type="button" onClick={() => form.setValue("image", "", { shouldDirty: true })} className="btn btn-xs btn-ghost text-error mt-4">Remove</button>
                            )}
                        </div>
                    </div>

                    {/* Change Password */}
                    <div className="card bg-base-100 shadow-sm border border-base-200">
                        <div className="card-body p-6">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Lock size={18} /> Security</h2>
                            <div className="form-control">
                                <label className="label font-bold text-xs">New Password</label>
                                <input type="password" {...form.register("password")} className="input input-bordered rounded-lg" placeholder="••••••" />
                                {form.formState.errors.password && <span className="text-error text-xs mt-1">{form.formState.errors.password.message}</span>}
                            </div>
                            <div className="form-control mt-4">
                                <label className="label font-bold text-xs">Confirm Password</label>
                                <input type="password" {...form.register("confirmPassword")} className="input input-bordered rounded-lg" placeholder="••••••" />
                                {form.formState.errors.confirmPassword && <span className="text-error text-xs mt-1">{form.formState.errors.confirmPassword.message}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* CENTER/RIGHT: Details & Address Book */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="card bg-base-100 shadow-sm border border-base-200">
                        <div className="card-body p-6">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><User size={20} /> Personal Information</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label font-bold text-sm">Full Name</label>
                                    <input {...form.register("name")} className="input input-bordered rounded-lg" />
                                    {form.formState.errors.name && <span className="text-error text-xs mt-1">{form.formState.errors.name.message}</span>}
                                </div>
                                <div className="form-control">
                                    <label className="label font-bold text-sm">Email</label>
                                    <input value={initialData.email} disabled className="input input-bordered rounded-lg opacity-60 cursor-not-allowed" />
                                </div>
                                <div className="form-control ">
                                    <label className="label font-bold text-sm">Phone Number</label>
                                    <input {...form.register("phone")} className="input input-bordered w-full rounded-lg" />
                                    {form.formState.errors.phone && <span className="text-error text-xs mt-1">{form.formState.errors.phone.message}</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Address Book */}
                    <div className="card bg-base-100 shadow-sm border border-base-200">
                        <div className="card-body p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold flex items-center gap-2"><MapPin size={20} /> Address Book</h2>
                                <button type="button" onClick={() => append({ province: "Bagmati", district: "Kathmandu", city: "Kathmandu", street: "", isDefault: fields.length === 0, ward: 0, postalCode: "", phone: "" })} className="btn btn-sm btn-ghost gap-1 text-primary">
                                    <Plus size={16} /> Add New
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
                                        isDefault={form.watch(`addresses.${index}.isDefault`) || false}
                                    />
                                ))}
                                {fields.length === 0 && (
                                    <div className="text-center py-8 opacity-50 border-2 border-dashed border-base-200 rounded-xl">
                                        <p>No addresses saved.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </form>
    )
}