"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Menü</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dashboard Navigation</DialogTitle>
          <DialogDescription>Wählen Sie einen Bereich aus, den Sie anzeigen möchten.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">Übersicht</TabsTrigger>
              <TabsTrigger value="blanketts">Blanketts</TabsTrigger>
              <TabsTrigger value="activity">Aktivität</TabsTrigger>
              <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => setOpen(false)}>Auswählen</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
