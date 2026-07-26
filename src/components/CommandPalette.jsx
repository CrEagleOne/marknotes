import { Command } from "lucide-react";

export default function CommandPalette({
  commands,
  inputRef,
  onClose,
  onQueryChange,
  onRunCommand,
  query,
  translate,
}) {
  const matchingCommands = commands.filter((command) =>
    command.label
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase()),
  );

  return (
    <div className="command-overlay" onMouseDown={onClose}>
      <section
        className="command-palette"
        role="dialog"
        aria-modal="true"
        aria-label={translate("commandPalette")}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="command-search">
          <Command aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && matchingCommands[0]) {
                event.preventDefault();
                onRunCommand(matchingCommands[0]);
              }
            }}
            placeholder={translate("searchCommands")}
          />
          <kbd>Esc</kbd>
        </div>
        <div className="command-list" role="list">
          {matchingCommands.length > 0 ? (
            matchingCommands.map((command) => (
              <button key={command.id} onClick={() => onRunCommand(command)}>
                <span>{command.label}</span>
                {command.shortcut && <kbd>{command.shortcut}</kbd>}
              </button>
            ))
          ) : (
            <p>{translate("noCommands")}</p>
          )}
        </div>
      </section>
    </div>
  );
}
