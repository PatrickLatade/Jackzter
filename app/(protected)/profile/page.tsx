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

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--; // hasn't had birthday yet this year
  }

  return age >= 0 ? age : "";
}


export default function ProfilePage() {
  const { user, updateUser, updateProfile } = useAuth();

  // ------------------- BASIC INFO FORM -------------------
  const [basicForm, setBasicForm] = useState({
    username: user?.username ?? "",
    email: user?.email ?? "",
    oldPassword: "",
    newPassword: "",
  });
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [basicErrors, setBasicErrors] = useState<{ [key: string]: string }>({});
  const [basicError, setBasicError] = useState("");

  // ------------------- PERSONAL INFO FORM -------------------
  const [profileForm, setProfileForm] = useState({
    age: user?.profile?.age ?? "",
    birthday: user?.profile?.birthday ?? "",
    profilePicture: user?.profile?.profilePicture ?? "",
  });
  const [profileErrors, setProfileErrors] = useState<{ [key: string]: string }>(
    {}
  );
  const [profileError, setProfileError] = useState("");

  // ------------------- CROPPING FORM -------------------
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // ------------------- EFFECTS -------------------
  useEffect(() => {
    const emailChanged = basicForm.email !== (user?.email ?? "");
    const passwordChanged = basicForm.newPassword.trim() !== "";
    setRequiresPassword(emailChanged || passwordChanged);
  }, [basicForm.email, basicForm.newPassword, user?.email]);

  // ------------------- HANDLERS -------------------
  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBasicForm({ ...basicForm, [e.target.name]: e.target.value });
    setBasicErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setBasicError("");
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
    setProfileErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setProfileError("");
  };

  const onCropComplete = useCallback((_: Area, croppedArea: Area) => {
  setCroppedAreaPixels(croppedArea);
  }, []);

  const handleBasicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBasicErrors({});
    setBasicError("");

    if (requiresPassword && !basicForm.oldPassword.trim()) {
      setBasicErrors((prev) => ({
        ...prev,
        oldPassword: "Current password is required",
      }));
      return;
    }

    try {
      await updateUser({
        username: basicForm.username,
        email: basicForm.email,
        oldPassword: basicForm.oldPassword || undefined,
        newPassword: basicForm.newPassword || undefined,
      });
      alert("✅ Basic info updated!");
      setBasicForm((prev) => ({ ...prev, oldPassword: "", newPassword: "" }));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setBasicError(err.message);
      } else {
        setBasicError("Something went wrong updating basic info");
      }
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrors({});
    setProfileError("");

    try {
      await updateProfile({
        age: profileForm.age ? Number(profileForm.age) : undefined,
        birthday: profileForm.birthday || undefined,
        profilePicture: profileForm.profilePicture,
      });
      alert("✅ Personal info updated!");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setProfileError(err.message);
      } else {
        setProfileError("Something went wrong updating profile");
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

    // 1️⃣ Upload to server
    const res = await fetch("http://localhost:4000/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    const fileUrl = data.url;

    // 2️⃣ Update local state
    setProfileForm({ ...profileForm, profilePicture: fileUrl });

    // 3️⃣ Save to database
    try {
      await updateProfile({ profilePicture: fileUrl });
      alert("✅ Profile picture updated!");
    } catch (err) {
      console.error("Failed to save profile picture to DB:", err);
      alert("❌ Failed to save profile picture in database");
    }

    setSelectedImage(null); // close crop modal
  };

  DatePickerInput.displayName = "DatePickerInput";

  // ------------------- RENDER -------------------
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ------------------- BASIC INFO ------------------- */}
        <section className="p-6 rounded-lg border shadow-sm bg-black">
          <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
          {basicError && (
            <div className="mb-4 text-red-600 text-sm font-medium">
              {basicError}
            </div>
          )}
          <form onSubmit={handleBasicSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                name="username"
                value={basicForm.username}
                onChange={handleBasicChange}
                className="w-full rounded-md border px-3 py-2"
              />
              {basicErrors.username && (
                <p className="text-red-500 text-sm mt-1">
                  {basicErrors.username}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={basicForm.email}
                onChange={handleBasicChange}
                className="w-full rounded-md border px-3 py-2"
              />
              {basicErrors.email && (
                <p className="text-red-500 text-sm mt-1">{basicErrors.email}</p>
              )}
            </div>

            {/* Old Password */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Current Password{" "}
                {requiresPassword && <span className="text-red-500">*</span>}
              </label>
              <input
                type="password"
                name="oldPassword"
                value={basicForm.oldPassword}
                onChange={handleBasicChange}
                placeholder="Enter current password"
                className="w-full rounded-md border px-3 py-2"
              />
              {basicErrors.oldPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {basicErrors.oldPassword}
                </p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium mb-1">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={basicForm.newPassword}
                onChange={handleBasicChange}
                placeholder="Enter new password"
                className="w-full rounded-md border px-3 py-2"
              />
              {basicErrors.newPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {basicErrors.newPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={requiresPassword && !basicForm.oldPassword.trim()}
              className={`px-4 py-2 rounded-md transition-colors ${
                requiresPassword && !basicForm.oldPassword.trim()
                  ? "bg-red-300 text-white cursor-not-allowed" // Styles for the disabled state
                  : "bg-brand-red text-white hover:bg-red-700" // Styles for the enabled state
              }`}
            >
              Save Basic Info
            </button>
          </form>
        </section>

        {/* ------------------- PERSONAL INFO ------------------- */}
        <section className="p-6 rounded-lg border shadow-sm bg-black">
          <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
          {profileError && (
            <div className="mb-4 text-red-600 text-sm font-medium">
              {profileError}
            </div>
          )}
          <form onSubmit={handleProfileSubmit} className="space-y-4">
          {/* Age */}
          <div>
            <label className="block text-sm font-medium mb-1">Age</label>
            <input
              type="number"
              name="age"
              value={profileForm.age}
              disabled
              className="w-full rounded-md border px-3 py-2 bg-black-100 text-white-600 cursor-not-allowed"
            />
            {profileErrors.age && (
              <p className="text-red-500 text-sm mt-1">{profileErrors.age}</p>
            )}
          </div>

            {/* Birthday */}
            <div>
              <label className="block text-sm font-medium mb-1">Birthday</label>
              <DatePicker
                selected={profileForm.birthday ? new Date(profileForm.birthday) : null}
                onChange={(date: Date | null) => {
                  const birthday = date?.toISOString().split("T")[0] ?? "";
                  const age = calculateAge(birthday);

                  setProfileForm({
                    ...profileForm,
                    birthday,
                    age, // always an int (or "")
                  });
                }}
                dateFormat="yyyy-MM-dd"
                customInput={<DatePickerInput />}
                showYearDropdown          // ✅ adds a year dropdown
                scrollableYearDropdown    // ✅ makes year list scrollable
                yearDropdownItemNumber={100} // ✅ number of years to show (100 years back)
                showMonthDropdown         // ✅ adds month dropdown too
                dropdownMode="select"     // ✅ makes both dropdowns selectable instead of scroll
              />
              {profileErrors.birthday && (
                <p className="text-red-500 text-sm mt-1">{profileErrors.birthday}</p>
              )}
            </div>

          {/* Profile Picture */}
          <div>
            <label className="block text-sm font-medium mb-1">Profile Picture</label>

            <div className="flex items-center space-x-4">
              {/* Circular preview */}
              <div className="w-20 h-20 rounded-full overflow-hidden border">
                {profileForm.profilePicture ? (
                  <img
                    src={profileForm.profilePicture}
                    alt="Profile preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    No Image
                  </div>
                )}
              </div>

              {/* File input */}
              <input
                type="file"
                accept="image/png, image/jpeg"
                onChange={(e) => {
                  if (!e.target.files?.[0]) return;
                  const file = e.target.files[0];
                  setSelectedImage(URL.createObjectURL(file)); // 👈 open crop modal
                }}
                className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
              />
            </div>

            {profileErrors.profilePicture && (
              <p className="text-red-500 text-sm mt-1">{profileErrors.profilePicture}</p>
            )}
          </div>

          {/* Cropper Modal */}
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

                {/* Controls */}
                <div className="flex justify-end space-x-2 mt-4">
                  <button
                    className="px-4 py-2 rounded bg-gray-200"
                    onClick={() => setSelectedImage(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded bg-blue-600 text-white"
                    onClick={handleCropSave}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}

            <button
              type="submit"
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            >
              Save Personal Info
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
