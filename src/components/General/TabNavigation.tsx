import { MessageSquareText, Settings, Wrench } from "lucide-react";
import { Tab } from "../../types";

interface TabNavigationProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function TabNavigation({
  activeTab,
  onTabChange,
}: TabNavigationProps) {
  const tabs = [
    { id: "chat" as Tab, label: "Chat", icon: MessageSquareText },
    { id: "tools" as Tab, label: "Tools", icon: Wrench },
    { id: "settings" as Tab, label: "Settings", icon: Settings },
  ];

  return (
    <div className="fixed left-8 top-1/2 -translate-y-1/2 flex flex-col gap-3">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              group flex items-center gap-3 px-4 py-3 rounded-xl
              transition-all duration-200 font-Inter hover:cursor-pointer
              ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
              }
            `}
            title={tab.label}
          >
            <Icon size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium whitespace-nowrap">
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
