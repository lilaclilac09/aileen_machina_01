export type ArchiveIndexItem = {
  href: string;
  label: string;
};

export type ArchiveIndexGroup = {
  id: string;
  label: string;
  items: ArchiveIndexItem[];
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function ArchiveIndex({
  groups,
  label = 'index',
}: {
  groups: ArchiveIndexGroup[];
  label?: string;
}) {
  return (
    <nav className="arc-index" aria-label={label}>
      {groups.map((group) => (
        <div key={group.id} className="arc-index-group">
          <a className="arc-index-head" href={`#${group.id}`}>
            {group.label}
          </a>
          <ul className="arc-index-list">
            {group.items.map((item) => (
              <li key={item.href}>
                <a href={item.href}>{item.label}</a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
