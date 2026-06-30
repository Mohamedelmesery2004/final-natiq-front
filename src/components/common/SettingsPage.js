import { useState, useRef, useEffect } from "react";
import {
    UserCircleIcon,
    LockClosedIcon,
    CameraIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    EyeIcon,
    EyeSlashIcon,
    ArrowUpTrayIcon,
    TrashIcon,
    ShieldCheckIcon,
    EnvelopeIcon,
    PhoneIcon,
    IdentificationIcon,
} from "@heroicons/react/24/outline";
import "./SettingsPage.css";

/**
 * Reusable account-settings page shared by every role dashboard.
 *
 * Props:
 *  - user:        { name, email, phone, role, avatar }  current user
 *  - roleLabel:   string shown in the role badge (e.g. "Agent", "Owner")
 *  - onSaveProfile(payload)   async — { name, phone, profileImageFile }  (optional)
 *  - onChangePassword(payload) async — { currentPassword, password }     (optional)
 *
 * When a handler is omitted the corresponding form falls back to persisting
 * the editable fields to localStorage so the UI still behaves consistently.
 */
function getInitials(name) {
    return (name || "U")
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
}

export default function SettingsPage({
    user = {},
    roleLabel = "Member",
    onSaveProfile,
    onChangePassword,
}) {
    const [tab, setTab] = useState("profile");

    // ── Profile form ──
    const [name, setName] = useState(user.name || "");
    const [phone, setPhone] = useState(user.phone || "");
    const [avatarPreview, setAvatarPreview] = useState(user.avatar || null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMsg, setProfileMsg] = useState(null); // { type, text }
    const fileRef = useRef(null);

    // ── Security form ──
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState(null);

    useEffect(() => {
        setName(user.name || "");
        setPhone(user.phone || "");
        setAvatarPreview(user.avatar || null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user.name, user.phone, user.avatar]);

    const initials = getInitials(name || user.name);

    const handleAvatarPick = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleAvatarRemove = () => {
        setAvatarFile(null);
        setAvatarPreview(null);
        if (fileRef.current) fileRef.current.value = "";
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setProfileMsg(null);
        if (!name.trim() || name.trim().length < 2) {
            setProfileMsg({ type: "error", text: "Name must be at least 2 characters." });
            return;
        }
        setSavingProfile(true);
        try {
            if (onSaveProfile) {
                await onSaveProfile({ name: name.trim(), phone: phone.trim(), profileImageFile: avatarFile });
            } else {
                // Fallback — persist to the cached user object.
                persistLocalUser({ name: name.trim(), phone: phone.trim() });
            }
            setAvatarFile(null);
            setProfileMsg({ type: "success", text: "Profile updated successfully." });
        } catch (err) {
            setProfileMsg({ type: "error", text: err?.message || "Could not update profile." });
        }
        setSavingProfile(false);
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        setPasswordMsg(null);
        if (newPassword.length < 6) {
            setPasswordMsg({ type: "error", text: "New password must be at least 6 characters." });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMsg({ type: "error", text: "Passwords do not match." });
            return;
        }
        if (!onChangePassword) {
            setPasswordMsg({ type: "error", text: "Password changes aren't available for this account yet." });
            return;
        }
        setSavingPassword(true);
        try {
            await onChangePassword({ currentPassword, password: newPassword });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordMsg({ type: "success", text: "Password changed successfully." });
        } catch (err) {
            setPasswordMsg({ type: "error", text: err?.message || "Could not change password." });
        }
        setSavingPassword(false);
    };

    const strength = passwordStrength(newPassword);

    return (
        <div className="set-shell">
            {/* ── Left rail: identity + vertical nav ── */}
            <aside className="set-rail">
                <div className="set-identity">
                    <div className="set-identity-avatar">
                        {avatarPreview ? <img src={avatarPreview} alt="Avatar" /> : initials}
                    </div>
                    <div className="set-identity-meta">
                        <h2>{name || user.name}</h2>
                        <p>{user.email}</p>
                    </div>
                    <span className="set-role-chip">{roleLabel}</span>
                </div>

                <nav className="set-rail-nav" data-active={tab}>
                    <span className="set-rail-indicator" aria-hidden="true" />
                    <button
                        type="button"
                        className={`set-rail-item ${tab === "profile" ? "active" : ""}`}
                        onClick={() => setTab("profile")}
                    >
                        <UserCircleIcon />
                        <span>
                            <strong>Profile</strong>
                            <small>Name, photo & contact</small>
                        </span>
                    </button>
                    <button
                        type="button"
                        className={`set-rail-item ${tab === "security" ? "active" : ""}`}
                        onClick={() => setTab("security")}
                    >
                        <ShieldCheckIcon />
                        <span>
                            <strong>Security</strong>
                            <small>Password & access</small>
                        </span>
                    </button>
                </nav>
            </aside>

            {/* ── Right pane: content ── */}
            <main className="set-pane">
                <header className="set-pane-head">
                    <div key={tab} className="set-anim">
                        <h1>{tab === "profile" ? "Profile" : "Security"}</h1>
                        <p>
                            {tab === "profile"
                                ? "Manage how you appear and how we reach you."
                                : "Keep your account protected with a strong password."}
                        </p>
                    </div>
                </header>

                {tab === "profile" && (
                    <form key="profile" className="set-form set-anim" onSubmit={handleProfileSubmit}>
                        {/* Avatar hero block */}
                        <section className="set-block">
                            <div className="set-block-mesh" aria-hidden="true" />
                            <div className="set-avatar-row">
                                <div className="set-avatar">
                                    {avatarPreview ? <img src={avatarPreview} alt="Avatar" /> : initials}
                                    <button
                                        type="button"
                                        className="set-avatar-edit"
                                        onClick={() => fileRef.current?.click()}
                                        title="Change photo"
                                    >
                                        <CameraIcon />
                                    </button>
                                </div>
                                <div className="set-avatar-meta">
                                    <h3>Profile photo</h3>
                                    <p>PNG or JPG, square works best.</p>
                                    <div className="set-avatar-actions">
                                        <button type="button" className="set-btn-soft" onClick={() => fileRef.current?.click()}>
                                            <ArrowUpTrayIcon /> Upload
                                        </button>
                                        {avatarPreview && (
                                            <button type="button" className="set-btn-ghost" onClick={handleAvatarRemove}>
                                                <TrashIcon /> Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarPick} />
                            </div>
                        </section>

                        {/* Fields block */}
                        <section className="set-block">
                            <h4 className="set-block-title">Personal details</h4>
                            <div className="set-grid">
                                <Field icon={<IdentificationIcon />} label="Full name">
                                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                                </Field>
                                <Field icon={<EnvelopeIcon />} label="Email" hint="Email can't be changed here.">
                                    <input type="email" value={user.email || ""} disabled placeholder="—" />
                                </Field>
                                <Field icon={<PhoneIcon />} label="Phone">
                                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Add a phone number" />
                                </Field>
                                <Field icon={<ShieldCheckIcon />} label="Role">
                                    <input type="text" value={roleLabel} disabled />
                                </Field>
                            </div>
                            {profileMsg && <FormMsg msg={profileMsg} />}
                        </section>

                        <footer className="set-footbar">
                            <span className="set-foot-note">Changes are saved to your account.</span>
                            <button type="submit" className="set-btn-primary" disabled={savingProfile}>
                                {savingProfile ? "Saving…" : "Save changes"}
                            </button>
                        </footer>
                    </form>
                )}

                {tab === "security" && (
                    <form key="security" className="set-form set-anim" onSubmit={handlePasswordSubmit}>
                        <section className="set-block">
                            <h4 className="set-block-title">Change password</h4>
                            <div className="set-grid set-grid-1">
                                <Field icon={<LockClosedIcon />} label="Current password">
                                    <div className="set-input-wrap">
                                        <input
                                            type={showCurrent ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Enter current password"
                                            autoComplete="current-password"
                                        />
                                        <button type="button" className="set-eye" onClick={() => setShowCurrent((v) => !v)}>
                                            {showCurrent ? <EyeSlashIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                </Field>
                                <Field icon={<LockClosedIcon />} label="New password">
                                    <div className="set-input-wrap">
                                        <input
                                            type={showNew ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="At least 6 characters"
                                            autoComplete="new-password"
                                        />
                                        <button type="button" className="set-eye" onClick={() => setShowNew((v) => !v)}>
                                            {showNew ? <EyeSlashIcon /> : <EyeIcon />}
                                        </button>
                                    </div>
                                    {newPassword && (
                                        <div className={`set-strength s-${strength.level}`}>
                                            <div className="set-strength-bar"><span style={{ width: `${strength.pct}%` }} /></div>
                                            <small>{strength.label}</small>
                                        </div>
                                    )}
                                </Field>
                                <Field icon={<CheckCircleIcon />} label="Confirm new password">
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter new password"
                                        autoComplete="new-password"
                                    />
                                </Field>
                            </div>
                            {passwordMsg && <FormMsg msg={passwordMsg} />}
                        </section>

                        <footer className="set-footbar">
                            <span className="set-foot-note">Use 8+ characters with a mix of letters & numbers.</span>
                            <button type="submit" className="set-btn-primary" disabled={savingPassword}>
                                {savingPassword ? "Updating…" : "Update password"}
                            </button>
                        </footer>
                    </form>
                )}
            </main>
        </div>
    );
}

function Field({ icon, label, hint, children }) {
    return (
        <label className="set-field">
            <span className="set-field-label">
                {icon}
                {label}
            </span>
            {children}
            {hint && <small>{hint}</small>}
        </label>
    );
}

function FormMsg({ msg }) {
    return (
        <div className={`set-msg set-msg-${msg.type}`}>
            {msg.type === "success" ? <CheckCircleIcon /> : <ExclamationCircleIcon />}
            <span>{msg.text}</span>
        </div>
    );
}

function passwordStrength(pw) {
    if (!pw) return { level: 0, pct: 0, label: "" };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 1, pct: 33, label: "Weak password" };
    if (score <= 3) return { level: 2, pct: 66, label: "Fair password" };
    return { level: 3, pct: 100, label: "Strong password" };
}

function persistLocalUser(patch) {
    for (const key of ["agent_user", "user", "owner_user", "auth_user"]) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        try {
            const obj = JSON.parse(raw);
            localStorage.setItem(key, JSON.stringify({ ...obj, ...patch }));
        } catch {
            /* ignore malformed cache */
        }
    }
}

