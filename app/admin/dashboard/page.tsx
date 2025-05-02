"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Inline-Komponenten statt Importe
function SimpleMobileNav() {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="border border-input bg-background hover:bg-accent hover:text-accent-foreground">Menü</Button>
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

function SimplePendingBlanketts() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Keine ausstehenden Blanketts</p>
    </div>
  )
}

function SimpleRecentActivity() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Keine aktuellen Aktivitäten</p>
    </div>
  )
}

function SimpleNotifications() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Keine neuen Benachrichtigungen</p>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="hidden md:block">
          <TabsList>
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="blanketts">Blanketts</TabsTrigger>
            <TabsTrigger value="activity">Aktivität</TabsTrigger>
            <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
          </TabsList>
        </div>
        <div className="md:hidden">
          <SimpleMobileNav />
        </div>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Offene Blanketts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">+2 seit letztem Monat</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktive Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">+4 seit letztem Monat</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Aktive Turniere</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">+1 seit letztem Monat</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Offene Blanketts</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <SimplePendingBlanketts />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Letzte Aktivitäten</CardTitle>
                <CardDescription>Es gab 24 Aktivitäten in den letzten 24 Stunden</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleRecentActivity />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="blanketts" className="space-y-4">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Offene Blanketts</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <SimplePendingBlanketts />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity" className="space-y-4">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Letzte Aktivitäten</CardTitle>
              <CardDescription>Es gab 24 Aktivitäten in den letzten 24 Stunden</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleRecentActivity />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notifications" className="space-y-4">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Benachrichtigungen</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleNotifications />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
