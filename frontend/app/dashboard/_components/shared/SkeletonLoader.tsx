export default function SkeletonLoader() {
  return (
    <>
      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-4 rounded-lg border-2 animate-pulse"
            style={{
              backgroundColor: 'var(--card-bg)',
              borderColor: 'var(--border-strong)'
            }}
          >
            <div 
              className="w-10 h-10 rounded-lg mb-3"
              style={{ backgroundColor: 'var(--hover-bg)' }}
            />
            <div 
              className="h-8 w-24 rounded mb-2"
              style={{ backgroundColor: 'var(--hover-bg)' }}
            />
            <div 
              className="h-4 w-32 rounded"
              style={{ backgroundColor: 'var(--hover-bg)' }}
            />
          </div>
        ))}
      </div>

      {/* Chart Cards Skeleton */}
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="p-6 rounded-lg border-2 mb-8 animate-pulse"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border-strong)'
          }}
        >
          <div 
            className="h-6 w-48 rounded mb-4"
            style={{ backgroundColor: 'var(--hover-bg)' }}
          />
          <div 
            className="h-80 w-full rounded"
            style={{ backgroundColor: 'var(--hover-bg)' }}
          />
        </div>
      ))}
    </>
  )
}
