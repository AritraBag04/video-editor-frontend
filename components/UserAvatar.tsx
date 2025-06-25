import { LogOut } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Auth } from "@/utils/auth";

export function UserAvatar() {
    const userEmail = Auth.getUserEmail();

    const handleLogout = () => {
        Auth.logout(); // Redirect to login page after logout
        window.location.reload();
    };

    // Get initials from email
    const getInitials = (email: string = "") => {
        return email.split("@")[0].slice(0, 2).toUpperCase();
    };

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    className="w-10 h-10 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition-colors"
                >
                    {getInitials(userEmail)}
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="min-w-[200px] bg-white rounded-md shadow-lg p-2 mt-2"
                    sideOffset={5}
                >
                    {/* Email display */}
                    <div className="px-2 py-2 text-sm text-gray-600 border-b border-gray-200">
                        {userEmail}
                    </div>

                    {/* Logout button */}
                    <DropdownMenu.Item
                        className="flex items-center gap-2 px-2 py-2 text-sm text-red-600 hover:bg-red-50 rounded cursor-pointer outline-none"
                        onSelect={handleLogout}
                    >
                        <LogOut size={16} />
                        Logout
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}