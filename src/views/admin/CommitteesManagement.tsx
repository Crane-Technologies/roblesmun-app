import {
  useState,
  useEffect,
  type FC,
  type ChangeEvent,
  type FormEvent,
  type ReactElement, // ✅ Agregar esta importación
} from "react";
import type { Committee } from "../../interfaces/Committee";
import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaImage,
  FaSave,
  FaTimes,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaClock,
  FaHome,
  FaGavel,
  FaUsers,
  FaCheck,
  FaBan,
  FaEye,
  FaVideo,
  FaBook,
  FaBalanceScale,
} from "react-icons/fa";
import Loader from "../../components/Loader";
import { FirestoreService } from "../../firebase/firestore";
import { SupabaseStorage } from "../../supabase/storage";
import { Link } from "react-router-dom";
import { useRef } from "react";

type SortOption =
  | "newest"
  | "oldest"
  | "alphabetical"
  | "reverse-alphabetical"
  | "seats-high"
  | "seats-low";

interface CommitteeWithId extends Committee {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SeatItem {
  name: string;
  available: boolean;
}

const CommitteesManagement: FC = () => {
  const [committees, setCommittees] = useState<CommitteeWithId[]>([]);
  const [filteredCommittees, setFilteredCommittees] = useState<
    CommitteeWithId[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCommittee, setSelectedCommittee] =
    useState<CommitteeWithId | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);

  // Estado para gestión de cupos
  const [newSeatName, setNewSeatName] = useState<string>("");
  const [bulkSeatsText, setBulkSeatsText] = useState<string>("");

  const [formData, setFormData] = useState<CommitteeWithId>({
    name: "",
    topic: "",
    img: "",
    seats: 0,
    seatsList: [],
    description: "",
    video: "",
    studyGuide: "",
    legalFramework: [],
    president: "",
  });

  const formRef = useRef<HTMLDivElement>(null);

  const fetchCommittees = async () => {
    setIsLoading(true);
    try {
      const data = await FirestoreService.getAll<CommitteeWithId>("committees");
      console.log("Comités obtenidos:", data);
      setCommittees(data.length > 0 ? data : []);
    } catch (error) {
      console.error("Error fetching committees:", error);
      setCommittees([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sortCommittees = (
    committeesList: CommitteeWithId[],
    option: SortOption
  ): CommitteeWithId[] => {
    const sorted = [...committeesList];

    switch (option) {
      case "newest":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.id || "");
          const dateB = new Date(b.createdAt || b.id || "");
          return dateB.getTime() - dateA.getTime();
        });

      case "oldest":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.id || "");
          const dateB = new Date(b.createdAt || b.id || "");
          return dateA.getTime() - dateB.getTime();
        });

      case "alphabetical":
        return sorted.sort((a, b) => a.name.localeCompare(b.name));

      case "reverse-alphabetical":
        return sorted.sort((a, b) => b.name.localeCompare(a.name));

      case "seats-high":
        return sorted.sort((a, b) => (b.seats || 0) - (a.seats || 0));

      case "seats-low":
        return sorted.sort((a, b) => (a.seats || 0) - (b.seats || 0));

      default:
        return sorted;
    }
  };

  const filterCommittees = (
    committeesList: CommitteeWithId[],
    search: string
  ): CommitteeWithId[] => {
    if (!search.trim()) return committeesList;

    const searchLower = search.toLowerCase();
    return committeesList.filter(
      (committee) =>
        committee.name.toLowerCase().includes(searchLower) ||
        committee.topic.toLowerCase().includes(searchLower) ||
        (committee.president &&
          committee.president.toLowerCase().includes(searchLower))
    );
  };

  useEffect(() => {
    const filtered = filterCommittees(committees, searchTerm);
    const sorted = sortCommittees(filtered, sortOption);
    setFilteredCommittees(sorted);
  }, [committees, sortOption, searchTerm]);

  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validaciones
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no debe superar los 5MB");
      return;
    }

    setImageFile(file);

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "seats") {
      const seatsCount = parseInt(value) || 0;
      setFormData((prev) => ({
        ...prev,
        [name]: seatsCount,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Gestión de cupos individuales
  const handleAddSeat = () => {
    if (!newSeatName.trim()) return;

    const newSeat: SeatItem = {
      name: newSeatName.trim(),
      available: true,
    };

    setFormData((prev) => ({
      ...prev,
      seatsList: [...prev.seatsList, newSeat],
      seats: prev.seatsList.length + 1,
    }));

    setNewSeatName("");
  };

  const handleRemoveSeat = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      seatsList: prev.seatsList.filter((_, i) => i !== index),
      seats: prev.seatsList.length - 1,
    }));
  };

  const handleToggleSeatAvailability = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      seatsList: prev.seatsList.map((seat, i) =>
        i === index ? { ...seat, available: !seat.available } : seat
      ),
    }));
  };

  // Gestión de cupos en lote
  const handleBulkSeatsAdd = () => {
    if (!bulkSeatsText.trim()) return;

    const seatNames = bulkSeatsText
      .split("\n")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    const newSeats: SeatItem[] = seatNames.map((name) => ({
      name,
      available: true,
    }));

    setFormData((prev) => ({
      ...prev,
      seatsList: [...prev.seatsList, ...newSeats],
      seats: prev.seatsList.length + newSeats.length,
    }));

    setBulkSeatsText("");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      topic: "",
      img: "",
      seats: 0,
      seatsList: [],
      description: "",
      video: "",
      studyGuide: "",
      legalFramework: [],
      president: "",
    });
    setImageFile(null);
    setImagePreview("");
    setEditingId(null);
    setShowForm(false);
    setNewSeatName("");
    setBulkSeatsText("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = formData.img;

      // Subir imagen si hay una nueva
      if (imageFile) {
        try {
          imageUrl = await SupabaseStorage.uploadImage(imageFile, "committees");
          console.log("✅ Imagen subida:", imageUrl);
        } catch (uploadError) {
          console.error("❌ Error subiendo imagen:", uploadError);
          alert("Error subiendo la imagen. El comité se guardará sin imagen.");
        }
      }

      const committeeData: CommitteeWithId = {
        ...formData,
        img: imageUrl,
        seats: formData.seatsList.length,
        legalFramework:
          formData.legalFramework?.filter((link) => link.trim()) || [],
      };

      if (editingId) {
        await FirestoreService.update("committees", editingId, {
          ...committeeData,
          updatedAt: new Date().toISOString(),
        });
        alert("Comité actualizado exitosamente");
      } else {
        await FirestoreService.add("committees", {
          ...committeeData,
          createdAt: new Date().toISOString(),
        });
        alert("Comité agregado exitosamente");
      }

      resetForm();
      await fetchCommittees();
    } catch (error) {
      console.error("Error al guardar comité:", error);
      alert("Error al guardar comité: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (committee: CommitteeWithId) => {
    setFormData({
      ...committee,
      legalFramework: committee.legalFramework || [],
    });
    setImagePreview(committee.img);
    setEditingId(committee.id || null);
    setShowForm(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100); // Espera breve para asegurar que el form esté visible
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      console.error("Invalid committee ID");
      return;
    }

    const confirmDelete = window.confirm(
      "¿Estás seguro de que deseas eliminar este comité? Esta acción no se puede deshacer."
    );
    if (!confirmDelete) return;

    setIsLoading(true);
    try {
      await FirestoreService.delete("committees", id);
      alert("Comité eliminado exitosamente");
      await fetchCommittees();
    } catch (error) {
      console.error("Error al eliminar comité:", error);
      alert("Error al eliminar comité: " + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const openDetailModal = (committee: CommitteeWithId) => {
    setSelectedCommittee(committee);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedCommittee(null);
    setShowDetailModal(false);
  };

  useEffect(() => {
    fetchCommittees();
  }, []);

  const sortOptions: Array<{
    value: SortOption;
    label: string;
    icon: ReactElement; // ✅ Cambiar JSX.Element por ReactElement
  }> = [
    { value: "newest", label: "Recientes", icon: <FaClock /> },
    { value: "oldest", label: "Antiguos", icon: <FaClock /> },
    { value: "alphabetical", label: "A-Z", icon: <FaSortAlphaDown /> },
    { value: "reverse-alphabetical", label: "Z-A", icon: <FaSortAlphaUp /> },
    { value: "seats-high", label: "Más cupos", icon: <FaUsers /> },
    { value: "seats-low", label: "Menos cupos", icon: <FaUsers /> },
  ];

  return (
    <div className="p-12 font-montserrat-light w-full">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
        <div className="flex flex-col items-start">
          <h1 className="text-4xl font-montserrat-bold">Gestión de Comités</h1>
          <Link
            to="/admin"
            className="px-6 py-2 my-4 bg-glass bg-glass rounded-lg text-[#f0f0f0] hover:border-[#d53137] hover:bg-gray-700 transition-colors flex items-center gap-2 font-medium"
          >
            <FaHome size={16} />
            Panel Admin
          </Link>
          <p className="text-gray-400">Total de comités: {committees.length}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Buscar comités..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-glass bg-glass rounded-lg text-[#f0f0f0] focus:border-[#d53137] outline-none"
          />
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#d53137] text-white cursor-pointer px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-[#b71c1c] transition-colors"
          >
            <FaPlus />
            {showForm ? "Cancelar" : "Nuevo Comité"}
          </button>
        </div>
      </div>

      {/* Sorting Options */}
      {!isLoading && committees.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-sm text-gray-300 font-medium">
            Ordenar por:
          </span>
          <div className="flex gap-2 flex-wrap">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSortChange(option.value)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors cursor-pointer ${
                  sortOption === option.value
                    ? "bg-[#d53137] text-white"
                    : "bg-glass text-gray-300 hover:bg-gray-700"
                }`}
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div
          ref={formRef}
          className="bg-glass p-6 rounded-lg mb-8 max-h-[80vh] overflow-y-auto"
        >
          <h2 className="text-2xl font-montserrat-bold mb-6">
            {editingId ? "Editar Comité" : "Nuevo Comité"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Información básica */}
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-300">
                    Nombre del comité *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 bg-glass rounded-lg text-[#f0f0f0] focus:border-[#d53137] outline-none"
                    placeholder="Ej: Consejo de Seguridad de la ONU"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-300">
                    Tópico *
                  </label>
                  <input
                    type="text"
                    name="topic"
                    value={formData.topic}
                    onChange={handleInputChange}
                    required
                    className="w-full p-3 bg-glass rounded-lg text-[#f0f0f0] focus:border-[#d53137] outline-none"
                    placeholder="Ej: Crisis en Medio Oriente"
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-300">
                    Presidente
                  </label>
                  <input
                    type="text"
                    name="president"
                    value={formData.president}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-glass rounded-lg text-[#f0f0f0] focus:border-[#d53137] outline-none"
                    placeholder="Nombre del presidente del comité"
                  />
                </div>

                {/* ✅ NUEVO: Checkbox para cupos dobles */}
                <div className="flex items-center gap-3 p-3 bg-glass rounded-lg">
                  <input
                    type="checkbox"
                    id="isDoubleSeat"
                    checked={formData.isDoubleSeat || false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isDoubleSeat: e.target.checked,
                      })
                    }
                    className="w-5 h-5 text-[#d53137] bg-gray-700 border-gray-600 rounded focus:ring-[#d53137] focus:ring-2"
                  />
                  <label
                    htmlFor="isDoubleSeat"
                    className="text-sm font-medium text-gray-300 cursor-pointer"
                  >
                    Cupos dobles (2 delegados por cupo - €30)
                    <span className="block text-xs text-gray-500 mt-1">
                      Activar para comités en pareja (Corte, Consejo de
                      Seguridad, etc.)
                    </span>
                  </label>
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-300">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full p-3 bg-glass rounded-lg text-[#f0f0f0] focus:border-[#d53137] outline-none resize-none"
                    placeholder="Descripción del comité y su funcionamiento..."
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-300">
                    Video (URL)
                  </label>
                  <input
                    type="url"
                    name="video"
                    value={formData.video}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-glass rounded-lg text-[#f0f0f0] focus:border-[#d53137] outline-none"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-300">
                    Guía de estudio (URL)
                  </label>
                  <input
                    type="url"
                    name="studyGuide"
                    value={formData.studyGuide}
                    onChange={handleInputChange}
                    className="w-full p-3 bg-glass rounded-lg text-[#f0f0f0] focus:border-[#d53137] outline-none"
                    placeholder="https://..."
                  />
                </div>
              </div>

              {/* Imagen y cupos */}
              <div className="space-y-6">
                {/* Logo del comité */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-300">
                    Logo del comité *
                  </label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-[#d53137] transition-colors">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="mx-auto max-h-32 max-w-full object-contain rounded-lg"
                        />
                        <div className="flex gap-2 justify-center">
                          <label className="bg-[#d53137] text-white px-3 py-2 rounded cursor-pointer hover:bg-[#b71c1c] transition-colors flex items-center gap-2">
                            <FaImage />
                            Cambiar
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview("");
                              setImageFile(null);
                            }}
                            className="bg-glass text-[#f0f0f0] px-3 py-2 rounded hover:bg-gray-700 transition-colors flex items-center gap-2"
                          >
                            <FaTimes />
                            Quitar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <FaImage className="mx-auto text-4xl text-gray-400" />
                        <label className="bg-[#d53137] text-white px-4 py-2 rounded cursor-pointer hover:bg-[#b71c1c] transition-colors inline-flex items-center gap-2">
                          <FaImage />
                          Seleccionar imagen
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-gray-400">
                          Máximo 5MB • JPG, PNG, GIF, WebP
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Gestión de cupos */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-300">
                    Cupos del comité ({formData.seatsList.length})
                  </label>

                  {/* Agregar cupo individual */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newSeatName}
                      onChange={(e) => setNewSeatName(e.target.value)}
                      placeholder="Nombre del cupo (ej: Estados Unidos)"
                      className="flex-1 p-2 bg-glass rounded text-[#f0f0f0] focus:border-[#d53137] outline-none text-sm"
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSeat();
                        }
                      }}
                    />
                    <button
                      aria-label="Agregar cupo"
                      type="button"
                      onClick={handleAddSeat}
                      className="bg-[#d53137] text-white px-3 py-2 rounded hover:bg-[#b71c1c] transition-colors"
                    >
                      <FaPlus />
                    </button>
                  </div>

                  {/* Agregar cupos en lote */}
                  <div className="mb-3">
                    <textarea
                      value={bulkSeatsText}
                      onChange={(e) => setBulkSeatsText(e.target.value)}
                      placeholder="Agregar múltiples cupos (uno por línea)&#10;Estados Unidos&#10;Reino Unido&#10;Francia"
                      className="w-full p-2 bg-glass rounded text-[#f0f0f0] focus:border-[#d53137] outline-none text-sm resize-none"
                      rows={3}
                    />
                    <button
                      type="button"
                      onClick={handleBulkSeatsAdd}
                      className="mt-2 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      Agregar en lote
                    </button>
                  </div>

                  {/* Lista de cupos */}
                  <div className="max-h-64 overflow-y-auto bg-glass rounded p-2">
                    {formData.seatsList.length > 0 ? (
                      <div className="space-y-1">
                        {formData.seatsList.map((seat, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-glass rounded text-sm"
                          >
                            <span
                              className={
                                seat.available
                                  ? "text-green-400"
                                  : "text-red-400"
                              }
                            >
                              {seat.name}
                            </span>
                            <div className="flex gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleSeatAvailability(index)
                                }
                                className={`px-2 py-1 rounded text-xs ${
                                  seat.available
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-green-600 hover:bg-green-700"
                                } transition-colors`}
                                title={
                                  seat.available
                                    ? "Marcar como no disponible"
                                    : "Marcar como disponible"
                                }
                              >
                                {seat.available ? <FaBan /> : <FaCheck />}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveSeat(index)}
                                className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                                title="Eliminar cupo"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-sm text-center py-4">
                        No hay cupos agregados
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="mt-4">
                <label className="block mb-2 text-sm font-medium text-gray-300">
                  Máx. cupos por delegación pequeña (&lt; 13)
                </label>
                <input
                  aria-label="input"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.maxSeatsPerSmallDelegation || 2}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxSeatsPerSmallDelegation: parseInt(e.target.value) || 3,
                    })
                  }
                  className="w-full p-2 bg-glass rounded text-[#f0f0f0] focus:border-[#d53137] outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Límite de cupos que puede seleccionar una delegación pequeña
                </p>
              </div>

              <div className="mt-4">
                <label className="block mb-2 text-sm font-medium text-gray-300">
                  Máx. cupos por delegación grande (≥ 13)
                </label>
                <input
                  aria-label="input"
                  type="number"
                  min="1"
                  max="15"
                  value={formData.maxSeatsPerLargeDelegation || 4}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxSeatsPerLargeDelegation: parseInt(e.target.value) || 5,
                    })
                  }
                  className="w-full p-2 bg-glass rounded text-[#f0f0f0] focus:border-[#d53137] outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Límite de cupos que puede seleccionar una delegación grande
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-600">
              <button
                type="submit"
                disabled={isSubmitting || formData.seatsList.length === 0}
                className="bg-[#d53137] text-white px-8 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                <FaSave />
                {isSubmitting
                  ? "Guardando..."
                  : editingId
                  ? "Actualizar"
                  : "Guardar"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-glass text-[#f0f0f0] px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <FaTimes />
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading && <Loader message="Cargando comités..." />}

      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCommittees.map((committee) => (
            <div
              key={committee.id}
              className="p-6 bg-glass rounded-lg border border-gray-700 hover:border-[#d53137] transition-all duration-300"
            >
              <div className="flex items-center justify-center mb-4 h-32 rounded overflow-hidden">
                <img
                  src={committee.img}
                  alt={committee.name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA9TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjNjY2Ii8+Cjwvc3ZnPgo=";
                  }}
                />
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-montserrat-bold line-clamp-2 min-h-[3rem]">
                  {committee.name}
                </h3>

                <p className="text-sm text-gray-300 line-clamp-2">
                  <strong>Tópico:</strong> {committee.topic}
                </p>

                {committee.president && (
                  <p className="text-sm text-blue-300">
                    <strong>Presidente:</strong> {committee.president}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <FaUsers />
                    {committee.seats} cupos
                  </span>
                  <span className="flex items-center gap-1">
                    <FaCheck className="text-green-400" />
                    {
                      committee.seatsList.filter((seat) => seat.available)
                        .length
                    }{" "}
                    disponibles
                  </span>
                </div>

                {committee.description && (
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {committee.description}
                  </p>
                )}
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-gray-600">
                <button
                  onClick={() => openDetailModal(committee)}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <FaEye />
                  Ver
                </button>
                <button
                  onClick={() => handleEdit(committee)}
                  className="flex-1 bg-glass text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors cursor-pointer"
                >
                  <FaEdit />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(committee.id!)}
                  className="flex-1 bg-[#d53137] text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-2 hover:bg-red-700 transition-colors cursor-pointer"
                >
                  <FaTrash />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty States */}
      {!isLoading && committees.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <FaGavel className="mx-auto text-8xl mb-6 opacity-30" />
          <h3 className="text-2xl font-montserrat-bold mb-2">
            No hay comités registrados
          </h3>
          <p className="text-lg mb-6">
            Haz clic en "Nuevo Comité" para agregar el primero
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#d53137] text-white px-8 py-3 rounded-lg hover:bg-[#b71c1c] transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <FaPlus />
            Agregar Comité
          </button>
        </div>
      )}

      {!isLoading &&
        committees.length > 0 &&
        filteredCommittees.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <FaGavel className="mx-auto text-8xl mb-6 opacity-30" />
            <h3 className="text-2xl font-montserrat-bold mb-2">
              No se encontraron comités
            </h3>
            <p className="text-lg mb-4">
              Intenta ajustar los términos de búsqueda
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="bg-[#d53137] text-white px-6 py-3 rounded-lg hover:bg-[#b71c1c] transition-colors cursor-pointer"
            >
              Limpiar búsqueda
            </button>
          </div>
        )}

      {/* Detail Modal */}
      {showDetailModal && selectedCommittee && (
        <CommitteeDetailModal
          committee={selectedCommittee}
          onClose={closeDetailModal}
        />
      )}

      {/* Footer Stats */}
      <div className="mt-8 p-4 bg-glass rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-montserrat-bold text-[#f0f0f0]">
              {committees.length}
            </div>
            <div className="text-sm text-gray-400">Total Comités</div>
          </div>
          <div>
            <div className="text-2xl font-montserrat-bold text-blue-400">
              {committees.reduce((sum, c) => sum + c.seats, 0)}
            </div>
            <div className="text-sm text-gray-400">Total Cupos</div>
          </div>
          <div>
            <div className="text-2xl font-montserrat-bold text-green-400">
              {committees.reduce(
                (sum, c) => sum + c.seatsList.filter((s) => s.available).length,
                0
              )}
            </div>
            <div className="text-sm text-gray-400">Cupos Disponibles</div>
          </div>
          <div>
            <div className="text-2xl font-montserrat-bold text-red-400">
              {committees.reduce(
                (sum, c) =>
                  sum + c.seatsList.filter((s) => !s.available).length,
                0
              )}
            </div>
            <div className="text-sm text-gray-400">Cupos Ocupados</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CommitteeDetailModal: FC<{
  committee: CommitteeWithId;
  onClose: () => void;
}> = ({ committee, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-glass rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-montserrat-bold">{committee.name}</h2>
            <button
              aria-label="Cerrar"
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <FaTimes size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <img
                src={committee.img}
                alt={committee.name}
                className="w-full h-48 object-contain rounded mb-4"
              />

              <div className="space-y-3">
                <p>
                  <strong>Tópico:</strong> {committee.topic}
                </p>
                {committee.president && (
                  <p>
                    <strong>Presidente:</strong> {committee.president}
                  </p>
                )}
                <p>
                  <strong>Total de cupos:</strong> {committee.seats}
                </p>
                <p>
                  <strong>Cupos disponibles:</strong>{" "}
                  {committee.seatsList.filter((s) => s.available).length}
                </p>

                {committee.description && (
                  <div>
                    <strong>Descripción:</strong>
                    <p className="text-gray-300 text-sm mt-1">
                      {committee.description}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {committee.video && (
                    <a
                      href={committee.video}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-red-600 text-white px-3 py-2 rounded text-sm flex items-center gap-2 hover:bg-red-700 transition-colors"
                    >
                      <FaVideo />
                      Video
                    </a>
                  )}
                  {committee.studyGuide && (
                    <a
                      href={committee.studyGuide}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-3 py-2 rounded text-sm flex items-center gap-2 hover:bg-blue-700 transition-colors"
                    >
                      <FaBook />
                      Guía de estudio
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-montserrat-bold mb-3">
                Lista de Cupos
              </h3>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {committee.seatsList.map((seat, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-sm flex items-center justify-between ${
                      seat.available
                        ? "bg-green-900/20 text-green-300"
                        : "bg-red-900/20 text-red-300"
                    }`}
                  >
                    <span>{seat.name}</span>
                    <span className="text-xs">
                      {seat.available ? "Disponible" : "Ocupado"}
                    </span>
                  </div>
                ))}
              </div>

              {committee.legalFramework &&
                committee.legalFramework.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-lg font-montserrat-bold mb-3 flex items-center gap-2">
                      <FaBalanceScale />
                      Marco Legal
                    </h3>
                    <div className="space-y-2">
                      {committee.legalFramework.map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-blue-400 hover:text-blue-300 text-sm underline break-all"
                        >
                          {link}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitteesManagement;
