import { createClient } from "@supabase/supabase-js";
import type { FileObject } from "@supabase/storage-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export class SupabaseStorage {
  static async uploadImage(
    file: File,
    folder: string = "sponsors",
  ): Promise<string> {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // ✅ Seleccionar bucket según el folder
      let bucketName = "roblesmun-images"; // Default

      if (folder === "committees") {
        bucketName = "committees";
      } else if (folder === "sponsors") {
        bucketName = "sponsors";
      }

      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw new Error(`Error uploading image: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error("Error in uploadImage:", error);
      throw error;
    }
  }

  // ✅ Método específico para imágenes de patrocinadores
  static async uploadSponsorImage(file: File): Promise<string> {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      console.log("📄 Subiendo logo de patrocinador:", fileName);

      // Validaciones
      if (!file.type.startsWith("image/")) {
        throw new Error("El archivo debe ser una imagen");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("La imagen no debe superar los 5MB");
      }

      const { error } = await supabase.storage
        .from("sponsors") // ✅ Usar bucket específico para patrocinadores
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        throw new Error(`Error uploading sponsor image: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("sponsors")
        .getPublicUrl(fileName);

      console.log("✅ Logo de patrocinador subido:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Error in uploadSponsorImage:", error);
      throw error;
    }
  }

  // ✅ Método para eliminar imágenes de patrocinadores
  static async deleteSponsorImage(url: string): Promise<void> {
    try {
      const urlParts = url.split("/storage/v1/object/public/sponsors/");
      if (urlParts.length < 2) {
        throw new Error("Invalid sponsor image URL format");
      }
      const path = urlParts[1];

      const { error } = await supabase.storage.from("sponsors").remove([path]);

      if (error) {
        throw new Error(`Error deleting sponsor image: ${error.message}`);
      }
    } catch (error) {
      console.error("Error in deleteSponsorImage:", error);
    }
  }

  // ✅ Método específico para imágenes de comités
  static async uploadCommitteeImage(file: File): Promise<string> {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      console.log("📄 Subiendo imagen de comité:", fileName);

      if (!file.type.startsWith("image/")) {
        throw new Error("El archivo debe ser una imagen");
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error("La imagen no debe superar los 5MB");
      }

      const { error } = await supabase.storage
        .from("committees")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        throw new Error(`Error uploading committee image: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("committees")
        .getPublicUrl(fileName);

      console.log("✅ Imagen de comité subida:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Error in uploadCommitteeImage:", error);
      throw error;
    }
  }

  // ✅ Método para eliminar imágenes de comités
  static async deleteCommitteeImage(url: string): Promise<void> {
    try {
      const urlParts = url.split("/storage/v1/object/public/committees/");
      if (urlParts.length < 2) {
        throw new Error("Invalid committee image URL format");
      }
      const path = urlParts[1];

      const { error } = await supabase.storage
        .from("committees")
        .remove([path]);

      if (error) {
        throw new Error(`Error deleting committee image: ${error.message}`);
      }
    } catch (error) {
      console.error("Error in deleteCommitteeImage:", error);
    }
  }

  static async uploadPDF(file: File): Promise<string> {
    try {
      console.log("🚀 Upload directo - sin folder");
      console.log(
        "📄 File:",
        file.name,
        "Size:",
        file.size,
        "Type:",
        file.type,
      );

      if (!file.type.includes("pdf")) {
        throw new Error("El archivo debe ser un PDF");
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error("El PDF no debe superar los 10MB");
      }

      console.log("📍 Upload path:", file.name);
      console.log("🔄 Starting upload...");

      const { data, error } = await supabase.storage
        .from("registrations")
        .upload(file.name, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        console.error("❌ Error:", error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      console.log("✅ Upload successful:", data);

      const { data: urlData } = supabase.storage
        .from("registrations")
        .getPublicUrl(file.name);

      console.log("🔗 Success:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error("💥 Failed:", error);
      throw error;
    }
  }

  static async deleteImage(url: string): Promise<void> {
    try {
      const urlParts = url.split("/storage/v1/object/public/roblesmun-images/");
      if (urlParts.length < 2) {
        throw new Error("Invalid URL format");
      }
      const path = urlParts[1];

      const { error } = await supabase.storage
        .from("roblesmun-images")
        .remove([path]);

      if (error) {
        throw new Error(`Error deleting image: ${error.message}`);
      }
    } catch (error) {
      console.error("Error in deleteImage:", error);
    }
  }

  static async deletePDF(url: string): Promise<void> {
    try {
      const urlParts = url.split("/storage/v1/object/public/registrations/");
      if (urlParts.length < 2) {
        throw new Error("Invalid PDF URL format");
      }
      const path = urlParts[1];

      const { error } = await supabase.storage
        .from("registrations")
        .remove([path]);

      if (error) {
        throw new Error(`Error deleting PDF: ${error.message}`);
      }
    } catch (error) {
      console.error("Error in deletePDF:", error);
    }
  }

  static async listPDFs(
    folder: string = "registrations",
  ): Promise<FileObject[]> {
    try {
      const { data, error } = await supabase.storage
        .from("registrations")
        .list(folder);

      if (error) {
        throw new Error(`Error listing PDFs: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Error in listPDFs:", error);
      return [];
    }
  }

  static getPublicImageUrl(
    fileName: string,
    bucket: string = "general",
  ): string {
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);

    return data.publicUrl;
  }

  static async listFiles(bucket: string = "general"): Promise<FileObject[]> {
    try {
      const { data, error } = await supabase.storage.from(bucket).list();

      if (error) {
        throw new Error(`Error listing files: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error("Error in listFiles:", error);
      return [];
    }
  }

  static async uploadPressImage(
    file: File,
    sectionBucket?: string,
  ): Promise<string> {
    try {
      const fileExt = file.name.split(".").pop();
      const folder = sectionBucket || "general";
      const fileName = `${folder}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      console.log("📄 Subiendo imagen de prensa:", fileName);

      if (!file.type.startsWith("image/")) {
        throw new Error("El archivo debe ser una imagen");
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error("La imagen no debe superar los 10MB");
      }

      const { error } = await supabase.storage
        .from("press")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        throw new Error(`Error uploading press image: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("press")
        .getPublicUrl(fileName);

      console.log("✅ Imagen de prensa subida:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Error in uploadPressImage:", error);
      throw error;
    }
  }

  static async uploadPressVideo(
    file: File,
    sectionBucket?: string,
  ): Promise<string> {
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      const folder = sectionBucket || "general";
      const fileName = `${folder}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      console.log("📄 Subiendo video de prensa:", fileName);

      const allowedVideoTypes = [
        "video/mp4",
        "video/quicktime",
        "video/webm",
        "video/x-matroska",
      ];

      const allowedExtensions = ["mp4", "mov", "webm", "mkv", "avi"];

      const isValidByType = allowedVideoTypes.includes(file.type);
      const isValidByExt = allowedExtensions.includes(fileExt || "");

      if (!isValidByType && !isValidByExt) {
        throw new Error(
          `Formato no soportado: ${file.name}\nTipo detectado: ${
            file.type || "desconocido"
          }`,
        );
      }

      if (!isValidByType && isValidByExt) {
        console.warn(
          `⚠️ Tipo MIME no detectado o incorrecto (${file.type}), pero la extensión .${fileExt} es válida. Continuando...`,
        );
      }

      if (file.size > 100 * 1024 * 1024) {
        throw new Error("El video no debe superar los 100MB");
      }

      const { error } = await supabase.storage
        .from("press")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        throw new Error(`Error uploading press video: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from("press")
        .getPublicUrl(fileName);

      console.log("✅ Video de prensa subido:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Error in uploadPressVideo:", error);
      throw error;
    }
  }

  static async deletePressFile(url: string): Promise<void> {
    try {
      const urlParts = url.split("/storage/v1/object/public/press/");
      if (urlParts.length < 2) {
        throw new Error("Invalid press file URL format");
      }
      const filePath = urlParts[1];

      const { error } = await supabase.storage.from("press").remove([filePath]);

      if (error) {
        throw new Error(`Error deleting press file: ${error.message}`);
      }

      console.log("✅ Archivo de prensa eliminado:", filePath);
    } catch (error) {
      console.error("Error in deletePressFile:", error);
      throw error;
    }
  }

  // Generic file upload method
  static async uploadFile(
    file: File,
    folder: string = "assignments",
  ): Promise<string> {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      console.log("📄 Subiendo archivo:", filePath);

      // Determinar bucket según el tipo de archivo o folder
      let bucketName = "roblesmun-images"; // Default para imágenes

      // Si es un PDF o está en folder de assignments, usar bucket registrations
      if (file.type === "application/pdf" || folder === "assignments") {
        bucketName = "registrations";
      }

      console.log("📦 Bucket seleccionado:", bucketName);

      const { error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        throw new Error(`Error uploading file: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      console.log("✅ Archivo subido:", urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error("Error in uploadFile:", error);
      throw error;
    }
  }
}

// Export helper function
export const uploadFile = SupabaseStorage.uploadFile;
