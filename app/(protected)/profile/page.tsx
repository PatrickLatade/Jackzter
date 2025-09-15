"use client";

import { useAuth } from "@/src/hooks/useAuth";
import { useState, useEffect, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CalendarIcon } from "@heroicons/react/24/outline";
import React, { forwardRef } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/src/utils/cropImage";
import { Area } from "react-easy-crop";

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string;
  onClick?: () => void;
}

function calculateAge(birthday: string): number | "" {
  if (!birthday) return "";
  const birthDate = new Date(birthday);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age--;

  return age >= 0 ? age : "";
}

export default function ProfilePage() {
  const { user, updateMe } = useAuth();

  // ------------------- FORM STATE -------------------
  const [form, setForm] = useState({
    username: user?.username ?? "",
    email: user?.email ?? "",
    oldPassword: "",
    newPassword: "",
    age: user?.profile?.age ?? "",
    birthday: user?.profile?.birthday ?? "",
    profilePicture: user?.profile?.profilePicture ?? "",
  });
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [error, setError] = useState("");

  // ------------------- CROPPING STATE -------------------
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // ------------------- EFFECTS -------------------
  useEffect(() => {
    const emailChanged = form.email !== (user?.email ?? "");
    const passwordChanged = form.newPassword.trim() !== "";
    setRequiresPassword(emailChanged || passwordChanged);
  }, [form.email, form.newPassword, user?.email]);

  // ------------------- HANDLERS -------------------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setError("");
  };

  const onCropComplete = useCallback((_: Area, croppedArea: Area) => {
    setCroppedAreaPixels(croppedArea);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setError("");

    // ✅ Username validation
    if (/\s/.test(form.username)) {
      setErrors({ username: "Username cannot contain spaces" });
      return;
    }

    if (requiresPassword && !form.oldPassword.trim()) {
      setErrors({ oldPassword: "Current password is required" });
      return;
    }

    try {
      await updateMe({
        username: form.username.trim(),
        email: form.email,
        oldPassword: form.oldPassword || undefined,
        newPassword: form.newPassword || undefined,
        age: form.age ? Number(form.age) : undefined,
        birthday: form.birthday || undefined,
        profilePicture: form.profilePicture,
      });
      alert("✅ Profile updated!");
      setForm((prev) => ({ ...prev, oldPassword: "", newPassword: "" }));
      } catch (err: unknown) {
        // If your updateMe() throws with a JSON { error: "..." }
        if (err instanceof Error) {
          const message = err.message;

          if (message.includes("Username")) {
            setErrors({ username: message });
          } else if (message.includes("Email")) {
            setErrors({ email: message });
          } else {
            setError(message); // generic error fallback
          }
        } else {
          setError("Something went wrong updating profile");
        }
      }
  };

  const DatePickerInput = forwardRef<HTMLInputElement, CustomInputProps>(
    ({ value, onClick, onChange }, ref) => (
      <div className="relative">
        <input
          ref={ref}
          value={value}
          onClick={onClick}
          onChange={onChange}
          placeholder="Select your birthday"
          className="w-full rounded-md border px-3 py-2 pr-10"
        />
        <CalendarIcon
          className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer"
          onClick={onClick}
        />
      </div>
    )
  );

  const handleCropSave = async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    const croppedBlob = await getCroppedImg(selectedImage, croppedAreaPixels);
    const croppedFile = new File([croppedBlob], "avatar.jpg", { type: "image/jpeg" });

    const formData = new FormData();
    formData.append("file", croppedFile);

    const res = await fetch("http://localhost:4000/upload", { method: "POST", body: formData });
    const data = await res.json();
    const fileUrl = data.url;

    setForm({ ...form, profilePicture: fileUrl });

    try {
      await updateMe({ profilePicture: fileUrl });
      alert("✅ Profile picture updated!");
    } catch (err) {
      console.error("Failed to save profile picture to DB:", err);
      alert("❌ Failed to save profile picture in database");
    }

    setSelectedImage(null);
  };

  DatePickerInput.displayName = "DatePickerInput";

  // ------------------- RENDER -------------------
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {error && <div className="col-span-2 text-red-600 text-sm font-medium">{error}</div>}

        {/* BASIC INFO */}
        <section className="p-6 rounded-lg border shadow-sm bg-black space-y-4">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className={`w-full rounded-md border px-3 py-2 ${
                  errors.username ? "border-red-500" : ""
                }`}
            />
          {errors.username && (
            <p className="text-red-500 text-sm mt-1">{errors.username}</p>
          )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Current Password {requiresPassword && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              name="oldPassword"
              value={form.oldPassword}
              onChange={handleChange}
              placeholder="Enter current password"
              className="w-full rounded-md border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input
              type="password"
              name="newPassword"
              value={form.newPassword}
              onChange={handleChange}
              placeholder="Enter new password"
              className="w-full rounded-md border px-3 py-2"
            />
          </div>
        </section>

        {/* PERSONAL INFO */}
        <section className="p-6 rounded-lg border shadow-sm bg-black space-y-4">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>

          <div>
            <label className="block text-sm font-medium mb-1">Age</label>
            <input
              type="number"
              name="age"
              value={form.age}
              disabled
              className="w-full rounded-md border px-3 py-2 bg-black-100 text-white-600 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Birthday</label>
            <DatePicker
              selected={form.birthday ? new Date(form.birthday) : null}
              onChange={(date: Date | null) => {
                const birthday = date?.toISOString().split("T")[0] ?? "";
                const age = calculateAge(birthday);
                setForm({ ...form, birthday, age });
              }}
              dateFormat="yyyy-MM-dd"
              customInput={<DatePickerInput />}
              showYearDropdown
              scrollableYearDropdown
              yearDropdownItemNumber={100}
              showMonthDropdown
              dropdownMode="select"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Profile Picture</label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border">
                {form.profilePicture ? (
                  <img src={form.profilePicture} alt="Profile preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    No Image
                  </div>
                )}
              </div>

              <input
                type="file"
                accept="image/png, image/jpeg"
                onChange={(e) => {
                  if (!e.target.files?.[0]) return;
                  const file = e.target.files[0];
                  setSelectedImage(URL.createObjectURL(file));
                }}
                className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
              />
            </div>

            {selectedImage && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="bg-white p-4 rounded-lg w-[90%] max-w-md">
                  <div className="relative w-full h-64">
                    <Cropper
                      image={selectedImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  </div>
                  <div className="flex justify-end space-x-2 mt-4">
                    <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setSelectedImage(null)}>Cancel</button>
                    <button className="px-4 py-2 rounded bg-blue-600 text-white" onClick={handleCropSave}>Save</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={requiresPassword && !form.oldPassword.trim()}
            className={`px-4 py-2 rounded-md transition-colors ${
              requiresPassword && !form.oldPassword.trim()
                ? "bg-red-300 text-white cursor-not-allowed"
                : "bg-brand-red text-white hover:bg-red-700"
            }`}
          >
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}
