"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { VideoUploadZone } from "@/components/shared/video-upload-zone";
import { TestimonialItem } from "@/components/shared/testimonial-item";
import { StaffRow } from "@/components/shared/staff-row";
import { testimonialsService } from "@/lib/services/testimonials.service";
import { staffService } from "@/lib/services/staff.service";
import { newsService, type NewsArticle } from "@/lib/services/news.service";
import { formatDate } from "@/lib/utils/format-date";
import { cn } from "@/lib/utils/cn";

type CmsTab = "testimonios" | "staff" | "noticias";

const TABS: { id: CmsTab; label: string; icon: string; filled?: boolean }[] = [
  { id: "testimonios", label: "Testimonios (Videos)", icon: "video_library", filled: true },
  { id: "staff", label: "Staff Médico", icon: "clinical_notes" },
  { id: "noticias", label: "Noticias y Promos", icon: "newspaper" },
];

const NEWS_CATEGORY_LABELS: Record<string, string> = {
  innovation: "Innovación",
  award: "Premio",
  promotion: "Promoción",
  event: "Evento",
};

const NEWS_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: "Borrador", bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400" },
  published: { label: "Publicado", bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-400" },
  archived: { label: "Archivado", bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-400" },
};

export default function ContenidosPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<CmsTab>("testimonios");

  // --- Testimonios State ---
  const [patientName, setPatientName] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- Queries ---
  const { data: testimonials = [], isLoading: loadingTestimonials } = useQuery({
    queryKey: ["testimonials"],
    queryFn: () => testimonialsService.getAll(),
  });

  const { data: staff = [], isLoading: loadingStaff } = useQuery({
    queryKey: ["staff"],
    queryFn: () => staffService.getAll(),
  });

  const { data: news = [], isLoading: loadingNews } = useQuery({
    queryKey: ["news"],
    queryFn: () => newsService.getAll(),
  });

  // --- Mutations ---
  const toggleVisibility = useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) =>
      testimonialsService.toggleVisibility(id, visible),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["testimonials"] }),
  });

  const deleteTestimonial = useMutation({
    mutationFn: (id: string) => testimonialsService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["testimonials"] }),
  });

  const deleteNews = useMutation({
    mutationFn: (id: string) => newsService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["news"] }),
  });

  const publishNews = useMutation({
    mutationFn: (id: string) => newsService.updateStatus(id, "published"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["news"] }),
  });

  // --- Handlers ---
  const handleFileSelect = useCallback((file: File) => {
    setVideoFile(file);
  }, []);

  async function handleCreateTestimonial() {
    if (!patientName.trim()) return;

    setIsUploading(true);
    try {
      let videoUrl: string | null = null;
      if (videoFile) {
        videoUrl = await testimonialsService.uploadVideo(videoFile);
      }

      await testimonialsService.create({
        patient_name: patientName,
        review_text: reviewText || null,
        rating,
        video_url: videoUrl,
        thumbnail_url: null,
      });

      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      setPatientName("");
      setRating(5);
      setReviewText("");
      setVideoFile(null);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <>
      {/* Header */}
      <header className="mb-10 flex justify-between items-end">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-extrabold tracking-tight text-on-surface dark:text-white mb-2">
            Gestor de Contenidos Web
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 font-medium">
            Actualiza la página principal en tiempo real y gestiona la
            reputación digital de la clínica.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-surface-container-low dark:bg-slate-900 text-primary dark:text-sky-400 font-semibold rounded-xl text-sm transition-all hover:bg-white dark:hover:bg-slate-800 shadow-sm cursor-pointer">
            Vista Previa Web
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <nav className="flex gap-8 mb-8 border-b border-outline-variant/30">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "pb-4 text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer",
              activeTab === tab.id
                ? "font-bold text-primary dark:text-sky-400 border-b-2 border-primary dark:border-sky-400"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            )}
          >
            <Icon
              name={tab.icon}
              size="sm"
              filled={activeTab === tab.id && !!tab.filled}
            />
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Tab: Testimonios */}
      {activeTab === "testimonios" && (
        <div className="grid grid-cols-12 gap-8">
          {/* Upload Zone & Form */}
          <section className="col-span-12 lg:col-span-5 space-y-6">
            <div className="bg-surface-container-lowest dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-transparent hover:border-primary/10 transition-all">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Icon name="upload_file" className="text-primary" size="sm" />
                Nuevo Testimonio
              </h3>

              <VideoUploadZone
                onFileSelect={handleFileSelect}
                isUploading={isUploading}
              />

              {videoFile && (
                <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center gap-2">
                  <Icon name="check_circle" size="sm" className="text-emerald-600" />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 truncate">
                    {videoFile.name}
                  </span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">
                    Nombre del Paciente
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    placeholder="Ej. Javier Montes"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">
                    Calificación
                  </label>
                  <div className="flex gap-1 py-3 px-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-outline-variant/20">
                    {Array.from({ length: 5 }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setRating(i + 1)}
                        className="cursor-pointer"
                      >
                        <Icon
                          name="star"
                          size="sm"
                          filled={i < rating}
                          className={
                            i < rating
                              ? "text-amber-400"
                              : "text-slate-300 dark:text-slate-700"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">
                    Reseña corta
                  </label>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-outline-variant/20 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none resize-none"
                    placeholder="Describe la experiencia del paciente..."
                  />
                </div>

                <Button
                  onClick={handleCreateTestimonial}
                  disabled={isUploading || !patientName.trim()}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-primary-container"
                  size="lg"
                >
                  {isUploading ? (
                    <>
                      <Icon name="progress_activity" size="sm" className="animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    "Subir y Publicar"
                  )}
                </Button>
              </div>
            </div>
          </section>

          {/* Testimonials List */}
          <section className="col-span-12 lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Icon name="play_circle" className="text-primary" size="sm" />
                Testimonios Publicados
              </h3>
            </div>

            {loadingTestimonials ? (
              <div className="py-20 text-center text-slate-400">
                <Icon name="progress_activity" className="animate-spin" />
                <p className="text-sm mt-2">Cargando testimonios...</p>
              </div>
            ) : testimonials.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <Icon name="video_library" size="xl" />
                <p className="text-sm mt-2">Sin testimonios aún</p>
              </div>
            ) : (
              testimonials.map((t) => (
                <TestimonialItem
                  key={t.id}
                  testimonial={t}
                  onToggleVisibility={(id, visible) =>
                    toggleVisibility.mutate({ id, visible })
                  }
                  onDelete={(id) => deleteTestimonial.mutate(id)}
                />
              ))
            )}
          </section>
        </div>
      )}

      {/* Tab: Staff Médico */}
      {activeTab === "staff" && (
        <div className="p-8 bg-surface-container-low dark:bg-slate-900/50 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-extrabold text-on-surface dark:text-white">
                Staff Médico
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Gestiona los perfiles que aparecen en la web.
              </p>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-primary dark:text-sky-400 font-bold rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 text-sm hover:bg-primary hover:text-white transition-all cursor-pointer">
              <Icon name="add_circle" size="sm" />
              Añadir Doctor
            </button>
          </div>

          {loadingStaff ? (
            <div className="py-20 text-center text-slate-400">
              <Icon name="progress_activity" className="animate-spin" />
              <p className="text-sm mt-2">Cargando staff...</p>
            </div>
          ) : staff.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <Icon name="group" size="xl" />
              <p className="text-sm mt-2">Sin doctores registrados</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-outline-variant/20">
                  <th className="pb-3 px-2">Doctor/Especialidad</th>
                  <th className="pb-3 px-2">Estado</th>
                  <th className="pb-3 px-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {staff.map((doctor) => (
                  <StaffRow
                    key={doctor.id}
                    doctor={doctor}
                    onEdit={() => {}}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab: Noticias y Promos */}
      {activeTab === "noticias" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-on-surface dark:text-white">
              Noticias y Promociones
            </h3>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 text-sm hover:opacity-90 transition-all cursor-pointer">
              <Icon name="add" size="sm" />
              Nueva Publicación
            </button>
          </div>

          {loadingNews ? (
            <div className="py-20 text-center text-slate-400">
              <Icon name="progress_activity" className="animate-spin" />
              <p className="text-sm mt-2">Cargando noticias...</p>
            </div>
          ) : news.length === 0 ? (
            <div className="py-20 text-center text-slate-400 bg-surface-container-lowest dark:bg-slate-900 rounded-2xl">
              <Icon name="newspaper" size="xl" />
              <p className="text-sm mt-2">Sin noticias publicadas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((article) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  onPublish={() => publishNews.mutate(article.id)}
                  onDelete={() => deleteNews.mutate(article.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

/** News Card sub-component */
function NewsCard({
  article,
  onPublish,
  onDelete,
}: {
  article: NewsArticle;
  onPublish: () => void;
  onDelete: () => void;
}) {
  const statusConfig =
    NEWS_STATUS_CONFIG[article.status] ?? NEWS_STATUS_CONFIG.draft;
  const categoryLabel =
    NEWS_CATEGORY_LABELS[article.category] ?? article.category;

  return (
    <div className="bg-surface-container-lowest dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-all">
      {/* Cover image */}
      <div className="aspect-video bg-slate-200 dark:bg-slate-800 relative">
        {article.cover_image_url ? (
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name="image" size="xl" className="text-slate-400" />
          </div>
        )}
        <span className="absolute top-3 left-3 px-2.5 py-0.5 bg-white/90 dark:bg-slate-900/90 rounded-full text-[10px] font-bold text-primary">
          {categoryLabel}
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusConfig.bg} ${statusConfig.text}`}
          >
            {statusConfig.label}
          </span>
          <span className="text-[10px] text-slate-400">
            {formatDate(article.created_at)}
          </span>
        </div>
        <h4 className="font-bold text-on-surface dark:text-white line-clamp-2 mb-1">
          {article.title}
        </h4>
        {article.excerpt && (
          <p className="text-xs text-slate-500 line-clamp-2">
            {article.excerpt}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          {article.status === "draft" && (
            <button
              onClick={onPublish}
              className="flex-1 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Publicar
            </button>
          )}
          <button
            onClick={onDelete}
            className="text-xs font-bold text-slate-400 hover:text-error py-2 px-3 rounded-lg transition-colors cursor-pointer"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
