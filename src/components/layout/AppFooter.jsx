export default function AppFooter({ statistics, translate, language, onLanguageChange }) {
  return (
    <footer>
      <span>Markdown</span>
      <span>
        {statistics.words} {translate("words")}
      </span>
      <span>
        {statistics.characters} {translate("chars")}
      </span>
      <span className="spacer" />
      {translate("ready")}
      <select
        value={language}
        onChange={(event) => onLanguageChange(event.target.value)}
      >
        <option value="en">English</option>
        <option value="fr">Français</option>
      </select>
    </footer>
  );
}
