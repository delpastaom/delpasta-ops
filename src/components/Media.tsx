import FoodIcon from './FoodIcon'

export default function Media({ photoUrl, icon, className }: { photoUrl?: string | null; icon: string; className?: string }) {
  if (photoUrl) {
    return (
      <div className={className} style={{ overflow: 'hidden' }}>
        <img src={photoUrl} className="w-full h-full object-cover" alt="" />
      </div>
    )
  }
  return <FoodIcon icon={icon} className={className} />
}
