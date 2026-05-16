import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Clock3 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { getFeaturedCourses } from '@/lib/data'
import { formatCurrency } from '@/lib/utils'

const CourseCard = async () => {
  const featuredCourses = await getFeaturedCourses()

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
      {featuredCourses.map((course) => (
        <Card key={course.id} className="group overflow-hidden border-border-hint transition-all duration-300 hover:shadow-lg">
          <div className="relative">
            <Image
              src={course.image_url || '/placeholder.svg'}
              alt={course.title}
              width={400}
              height={250}
              className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute left-4 top-4">
              <Badge className="bg-deep-sky text-clean-white">{course.level}</Badge>
            </div>
            <div className="absolute right-4 top-4">
              <Badge className="bg-muted-cyan text-deep-navy">{course.total_hours}h</Badge>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="mb-2 flex items-center justify-between gap-4">
              <span className="text-sm text-muted-slate">{course.category}</span>
              <div className="flex items-center gap-1 text-sm text-muted-slate">
                <Clock3 className="h-4 w-4" />
                {course.total_hours} hours
              </div>
            </div>
            <h3 className="mb-2 line-clamp-2 text-xl font-bold text-deep-navy">{course.title}</h3>
            <p className="mb-4 line-clamp-2 text-muted-slate">{course.short_description || course.description}</p>
            <div className="mb-4 text-right">
              {course.original_price ? (
                <span className="text-sm text-muted-slate line-through">{formatCurrency(course.original_price)}</span>
              ) : null}
              <div className="text-xl font-bold text-deep-sky">{formatCurrency(course.price)}</div>
            </div>
            <Button className="w-full bg-deep-sky hover:bg-blue-hover" asChild>
              <Link href={`/courses/${course.slug}`}>
                View Program Details
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default CourseCard
