export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: 'auto', overflow: 'visible' }}>
      {children}
    </div>
  );
}
