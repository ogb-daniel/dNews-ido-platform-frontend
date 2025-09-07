"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Clock } from "lucide-react"

interface CountdownTimerProps {
  endTime: number
  title?: string
}

export function CountdownTimer({ endTime, title = "Sale Ends In" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(endTime - Date.now())

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(Math.max(0, endTime - Date.now()))
    }, 1000)

    return () => clearInterval(timer)
  }, [endTime])

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000)

  return (
    <Card className="glass animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>

        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">{days}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Days</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">{hours}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Hours</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">{minutes}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Minutes</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">{seconds}</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide">Seconds</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
