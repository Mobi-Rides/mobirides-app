import { RoleSelector } from "@/components/RoleSelector";

const Profile = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Select Your Role</h2>
        <RoleSelector />
      </div>
    </div>
  );
};

export default Profile;