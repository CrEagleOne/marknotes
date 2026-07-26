import { FileText, X } from "lucide-react";
import IconButton from "../IconButton";

export default function TabsBar({ tabs, activeTabId, onSelectTab, onCloseTab }) {
  return (
    <div className="tabs" role="tablist" aria-label="Documents ouverts">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${tab.id === activeTabId ? "active" : ""}`}
        >
          <button
            role="tab"
            aria-selected={tab.id === activeTabId}
            onClick={() => onSelectTab(tab.id)}
            title={tab.path || tab.name}
          >
            <FileText />
            <span>{tab.name}{tab.dirty ? " *" : ""}</span>
          </button>
          <IconButton title="Fermer l'onglet" onClick={() => onCloseTab(tab.id)}>
            <X />
          </IconButton>
        </div>
      ))}
    </div>
  );
}
