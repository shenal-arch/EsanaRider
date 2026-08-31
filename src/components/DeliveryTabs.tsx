export type DeliveryTab = "active" | "completed";

interface DeliveryTabsProps {
  value: DeliveryTab;
  onChange: (tab: DeliveryTab) => void;
}

const tabs: Array<{ value: DeliveryTab; label: string; icon: string }> = [
  { value: "active", label: "Active", icon: "/assets/active.svg" },
  { value: "completed", label: "Completed", icon: "/assets/completed.svg" },
];

export function DeliveryTabs({ value, onChange }: DeliveryTabsProps) {
  return (
    <div className="delivery-tabs" role="tablist" aria-label="Delivery status">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          className={`delivery-tab ${value === tab.value ? "delivery-tab--active" : ""}`}
          role="tab"
          aria-selected={value === tab.value}
          onClick={() => onChange(tab.value)}
        >
          <img src={tab.icon} alt="" width="24" height="24" />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
