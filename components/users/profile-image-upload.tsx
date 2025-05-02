"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"
import { User, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getSupabaseClient } from "@/lib/supabase/client"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface ProfileImageUploadProps {
  initialImageUrl?: string | null
  onImageUpload: (url: string) => void
  className?: string
}

export function ProfileImageUpload({ initialImageUrl, onImageUpload, className = "" }: ProfileImageUploadProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = getSupabaseClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Überprüfen Sie den Dateityp
    if (!file.type.startsWith("image/")) {
      setError("Bitte wählen Sie eine Bilddatei aus.")
      return
    }

    // Überprüfen Sie die Dateigröße (max. 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Die Datei ist zu groß. Maximale Größe: 5MB.")
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Versuchen Sie, alle verfügbaren Buckets zu erhalten
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

      if (bucketsError) {
        throw new Error(`Fehler beim Abrufen der Buckets: ${bucketsError.message}`)
      }

      // Wenn keine Buckets vorhanden sind, versuchen Sie, einen zu erstellen
      let bucketName = "profile-images"

      if (!buckets || buckets.length === 0) {
        const { error: createBucketError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 5 * 1024 * 1024, // 5MB
        })

        if (createBucketError) {
          throw new Error(`Fehler beim Erstellen des Buckets: ${createBucketError.message}`)
        }
      } else {
        // Verwenden Sie den ersten verfügbaren Bucket
        bucketName = buckets[0].name
      }

      // Generieren Sie einen eindeutigen Dateinamen
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      // Laden Sie die Datei hoch
      const { error: uploadError, data } = await supabase.storage.from(bucketName).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (uploadError) {
        throw new Error(`Fehler beim Hochladen: ${uploadError.message}`)
      }

      // Holen Sie sich die öffentliche URL
      const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath)

      const publicUrl = publicUrlData.publicUrl
      setImageUrl(publicUrl)
      onImageUpload(publicUrl)
    } catch (err: any) {
      console.error("Fehler beim Hochladen des Profilbilds:", err)
      setError(err.message || "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setImageUrl(null)
    onImageUpload("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative mb-4">
        <div className="h-32 w-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          {isUploading ? (
            <LoadingSpinner className="h-10 w-10" />
          ) : imageUrl ? (
            <Image
              src={imageUrl || "/placeholder.svg"}
              alt="Profilbild"
              width={128}
              height={128}
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-16 w-16 text-gray-400" />
          )}
        </div>
        {imageUrl && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
            aria-label="Bild entfernen"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
          id="profile-image-upload"
        />
        <Button
          type="button"
          className="border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 rounded-md px-3 mb-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {imageUrl ? "Bild ändern" : "Bild hochladen"}
        </Button>
        {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
        <p className="text-xs text-muted-foreground mt-1">Empfohlene Größe: 500x500 Pixel (max. 5MB)</p>
      </div>
    </div>
  )
}
