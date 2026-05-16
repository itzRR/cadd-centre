export default function Loading() {
  return <div className="space-y-4">{[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div>
}
