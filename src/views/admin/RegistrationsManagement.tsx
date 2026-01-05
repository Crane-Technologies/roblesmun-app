import { useState, useEffect, type FC } from "react";
import type { RegistrationForm } from "../../interfaces/RegistrationForm";
import {
  FaEye,
  FaCheck,
  FaTimes,
  FaClock,
  FaSort,
  FaFilter,
  FaFileAlt,
  FaUser,
  FaDollarSign,
  FaClipboardList,
  FaLock,
  FaLockOpen,
  FaEyeSlash,
} from "react-icons/fa";
import { CiImport } from "react-icons/ci";
import Loader from "../../components/Loader";
import { FirestoreService } from "../../firebase/firestore";
import RegistrationsManagementModal from "../../components/RegistrationsManagementModal";
import AssignmentsModal from "../../components/AssignmentsModal";
import { AssignmentsPDFGenerator } from "../../components/AssignmentsPDFGenerator";
import { Link } from "react-router-dom";
import { FaHome } from "react-icons/fa";

type SortOption =
  | "newest"
  | "oldest"
  | "alphabetical"
  | "amount-high"
  | "amount-low";
type StatusFilter = "all" | "pending" | "verified" | "rejected";

interface RegistrationWithId extends RegistrationForm {
  id: string;
  createdAt?: string;
  status?: "pending" | "verified" | "rejected";
  assignedSeats?: string[];
  assignmentDate?: string;
  assignmentPdfUrl?: string;
  assignmentNotes?: string;
  assignmentValidated?: boolean;
  assignmentValidationDate?: string;
  assignmentPercentage?: number;
  isCompleteAssignment?: boolean;
}

const RegistrationsManagement: FC = () => {
  const [registrations, setRegistrations] = useState<RegistrationWithId[]>([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState<
    RegistrationWithId[]
  >([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRegistration, setSelectedRegistration] =
    useState<RegistrationWithId | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [showAssignmentModal, setShowAssignmentModal] =
    useState<boolean>(false);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [rate, setRate] = useState<number>(0);
  const [rateInput, setRateInput] = useState<string>("");
  const [rateLoading, setRateLoading] = useState<boolean>(false);

  const [registrationsOpen, setRegistrationsOpen] = useState<boolean>(false);
  const [isTogglingRegistrations, setIsTogglingRegistrations] =
    useState<boolean>(false);
  const [hideRejected, setHideRejected] = useState<boolean>(true);

  const fetchRegistrations = async () => {
    setIsLoading(true);
    try {
      const data = await FirestoreService.getAll<RegistrationWithId>(
        "registrations"
      );
      console.log("Inscripciones obtenidas:", data);
      setRegistrations(data.length > 0 ? data : []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      setRegistrations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sortRegistrations = (
    registrationsList: RegistrationWithId[],
    option: SortOption
  ): RegistrationWithId[] => {
    const sorted = [...registrationsList];

    switch (option) {
      case "newest":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || "");
          const dateB = new Date(b.createdAt || "");
          return dateB.getTime() - dateA.getTime();
        });

      case "oldest":
        return sorted.sort((a, b) => {
          const dateA = new Date(a.createdAt || "");
          const dateB = new Date(b.createdAt || "");
          return dateA.getTime() - dateB.getTime();
        });

      case "alphabetical":
        return sorted.sort((a, b) =>
          `${a.userFirstName} ${a.userLastName}`.localeCompare(
            `${b.userFirstName} ${b.userLastName}`
          )
        );

      case "amount-high":
        return sorted.sort((a, b) => (b.amount || 0) - (a.amount || 0));

      case "amount-low":
        return sorted.sort((a, b) => (a.amount || 0) - (b.amount || 0));

      default:
        return sorted;
    }
  };

  const filterRegistrations = (
    registrationsList: RegistrationWithId[],
    status: StatusFilter,
    search: string
  ): RegistrationWithId[] => {
    let filtered = [...registrationsList];

    if (status !== "all") {
      filtered = filtered.filter((reg) => (reg.status || "pending") === status);
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (reg) =>
          `${reg.userFirstName} ${reg.userLastName}`
            .toLowerCase()
            .includes(searchLower) ||
          reg.userEmail.toLowerCase().includes(searchLower) ||
          reg.userInstitution.toLowerCase().includes(searchLower) ||
          reg.transactionId.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

  useEffect(() => {
    const filtered = filterRegistrations(
      registrations,
      statusFilter,
      searchTerm
    );
    const sorted = sortRegistrations(filtered, sortOption);
    setFilteredRegistrations(sorted);
  }, [registrations, sortOption, statusFilter, searchTerm]);

  const handleStatusUpdate = async (
    id: string,
    newStatus: "pending" | "verified" | "rejected"
  ) => {
    try {
      await FirestoreService.update("registrations", id, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      setRegistrations((prev) =>
        prev.map((reg) => (reg.id === id ? { ...reg, status: newStatus } : reg))
      );

      alert(`Estado actualizado a: ${newStatus}`);
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Error al actualizar el estado");
    }
  };

  const handleDownloadPDF = (pdfUrl: string, fileName: string) => {
    if (!pdfUrl) {
      alert("No hay PDF disponible para esta inscripción");
      return;
    }

    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openDetailModal = (registration: RegistrationWithId) => {
    setSelectedRegistration(registration);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setSelectedRegistration(null);
    setShowDetailModal(false);
  };

  const openAssignmentModal = (registration: RegistrationWithId) => {
    setSelectedRegistration(registration);
    setShowAssignmentModal(true);
  };

  const closeAssignmentModal = () => {
    setSelectedRegistration(null);
    setShowAssignmentModal(false);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "verified":
        return "text-green-400 bg-green-900/20";
      case "rejected":
        return "text-red-400 bg-red-900/20";
      default:
        return "text-yellow-400 bg-yellow-900/20";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "verified":
        return <FaCheck />;
      case "rejected":
        return <FaTimes />;
      default:
        return <FaClock />;
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  useEffect(() => {
    const fetchRate = async () => {
      setRateLoading(true);
      try {
        const doc = await FirestoreService.getById<{ rate: number }>(
          "config",
          "registration"
        );
        if (doc && typeof doc.rate === "number") {
          setRate(doc.rate);
          setRateInput(doc.rate.toString());
        }
      } catch (e) {
        console.log("Error fetching rate:", e);
      } finally {
        setRateLoading(false);
      }
    };
    fetchRate();
  }, []);

  useEffect(() => {
    const fetchRegistrationsStatus = async () => {
      try {
        const config = await FirestoreService.getById<{
          registrationsOpen: boolean;
        }>("config", "registration");
        setRegistrationsOpen(config?.registrationsOpen ?? false);
      } catch (e) {
        console.error("Error fetching registrations status:", e);
        setRegistrationsOpen(false);
      }
    };
    fetchRegistrationsStatus();
  }, []);

  const sortOptions: Array<{
    value: SortOption;
    label: string;
    icon: React.ReactElement;
  }> = [
    { value: "newest", label: "Más recientes", icon: <FaClock /> },
    { value: "oldest", label: "Más antiguos", icon: <FaClock /> },
    { value: "alphabetical", label: "A-Z", icon: <FaSort /> },
    { value: "amount-high", label: "Mayor monto", icon: <FaDollarSign /> },
    { value: "amount-low", label: "Menor monto", icon: <FaDollarSign /> },
  ];

  const statusOptions = [
    {
      value: "all" as StatusFilter,
      label: "Todas",
      count: registrations.length,
    },
    {
      value: "pending" as StatusFilter,
      label: "Pendientes",
      count: registrations.filter((r) => (r.status || "pending") === "pending")
        .length,
    },
    {
      value: "verified" as StatusFilter,
      label: "Verificadas",
      count: registrations.filter((r) => r.status === "verified").length,
    },
    {
      value: "rejected" as StatusFilter,
      label: "Rechazadas",
      count: registrations.filter((r) => r.status === "rejected").length,
    },
  ];

  const handleRateUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const newRate = parseFloat(rateInput);
    if (isNaN(newRate) || newRate <= 0) {
      alert("Ingresa una tasa válida");
      return;
    }
    setRateLoading(true);
    try {
      await FirestoreService.set("config", "registration", { rate: newRate });
      setRate(newRate);
      alert("Tasa actualizada correctamente");
    } catch (e) {
      alert("Error al actualizar la tasa");
      console.log(e);
    } finally {
      setRateLoading(false);
    }
  };

  const handleToggleRegistrations = async () => {
    const newState = !registrationsOpen;
    const confirmMessage = newState
      ? "¿Estás seguro de que deseas ABRIR las inscripciones? Los usuarios podrán inscribirse."
      : "¿Estás seguro de que deseas CERRAR las inscripciones? Los usuarios NO podrán inscribirse.";

    if (!window.confirm(confirmMessage)) return;

    setIsTogglingRegistrations(true);
    try {
      await FirestoreService.set("config", "registration", {
        registrationsOpen: newState,
        rate: rate,
        updatedAt: new Date().toISOString(),
      });
      setRegistrationsOpen(newState);
      alert(`Inscripciones ${newState ? "ABIERTAS" : "CERRADAS"} exitosamente`);
    } catch (error) {
      console.error("Error toggling registrations:", error);
      alert("Error al cambiar el estado de las inscripciones");
    } finally {
      setIsTogglingRegistrations(false);
    }
  };

  // Modifica el array que se renderiza según el estado hideRejected
  const visibleRegistrations = hideRejected
    ? filteredRegistrations.filter((r) => r.status !== "rejected")
    : filteredRegistrations;

  return (
    <div className="p-12 font-montserrat-light w-full">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
        <div className="flex flex-col items-start">
          <h1 className="text-4xl font-montserrat-bold">
            Gestión de Inscripciones
          </h1>
          <Link
            to="/admin"
            className="px-6 py-2 my-4 bg-glass border border-gray-600 rounded-lg text-[#f0f0f0] hover:border-[#d53137] hover:bg-gray-700 transition-colors flex items-center gap-2 font-medium"
          >
            <FaHome size={16} />
            Panel Admin
          </Link>
          <p className="text-gray-400">
            Total de inscripciones: {registrations.length}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Buscar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-glass border border-gray-600 rounded-lg text-[#f0f0f0] focus:border-[#d53137] outline-none"
          />
        </div>
      </div>

      {!isLoading && registrations.length > 0 && (
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-300 font-medium flex items-center">
              <FaFilter className="mr-2" />
              Estado:
            </span>
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-4 py-2 cursor-pointer rounded-lg text-sm transition-colors ${
                  statusFilter === option.value
                    ? "bg-[#d53137] text-white"
                    : "bg-glass text-gray-300 hover:bg-gray-700"
                }`}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-300 font-medium flex items-center">
              <FaSort className="mr-2" />
              Ordenar:
            </span>
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSortOption(option.value)}
                className={`px-4 py-2 cursor-pointer rounded-lg flex items-center gap-2 text-sm transition-colors ${
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

      {isLoading && <Loader message="Cargando inscripciones..." />}

      {/* CONTROL DE INSCRIPCIONES */}
      <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Control de apertura/cierre */}
        <div className="bg-glass p-6 rounded-lg border-2 border-blue-600">
          <h2 className="text-xl font-montserrat-bold mb-4 flex items-center gap-2">
            {registrationsOpen ? (
              <FaLockOpen className="text-green-400" />
            ) : (
              <FaLock className="text-red-400" />
            )}
            Estado de Inscripciones
          </h2>
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-sm text-gray-400 mb-1">Estado actual:</p>
              <p
                className={`text-lg font-montserrat-bold ${
                  registrationsOpen ? "text-green-400" : "text-red-400"
                }`}
              >
                {registrationsOpen ? "ABIERTAS" : "CERRADAS"}
              </p>
            </div>
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                registrationsOpen
                  ? "bg-green-900/20 border-2 border-green-600"
                  : "bg-red-900/20 border-2 border-red-600"
              }`}
            >
              {registrationsOpen ? (
                <FaLockOpen className="text-green-400 text-2xl" />
              ) : (
                <FaLock className="text-red-400 text-2xl" />
              )}
            </div>
          </div>
          <button
            onClick={handleToggleRegistrations}
            disabled={isTogglingRegistrations}
            className={`w-full py-3 rounded-lg font-montserrat-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              registrationsOpen
                ? "bg-[#d53137] hover:bg-[#b71c1c] text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isTogglingRegistrations
              ? "Procesando..."
              : registrationsOpen
              ? "Cerrar Inscripciones"
              : "Abrir Inscripciones"}
          </button>
          <p className="text-xs text-gray-400 mt-3">
            {registrationsOpen
              ? "Al cerrar, los usuarios no podrán inscribirse hasta que las vuelvas a abrir."
              : "Al abrir, los usuarios podrán realizar sus inscripciones (si hay cupos disponibles)."}{" "}
          </p>
        </div>

        {/* Tasa de cambio */}
        <div className="bg-glass p-6 rounded-lg">
          <h2 className="text-xl font-montserrat-bold mb-4">Tasa de cambio</h2>
          <form onSubmit={handleRateUpdate} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Tasa actual:{" "}
                <span className="font-montserrat-bold text-white">{rate}</span>{" "}
                Bs/USD
              </label>
              <input
                type="number"
                aria-label="Tasa de cambio en Bs/USD"
                step="0.01"
                min="0"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                className="w-full p-3 bg-[#101010] border border-gray-600 rounded-lg text-[#f0f0f0] focus:border-[#d53137] outline-none"
                disabled={rateLoading}
                placeholder="Ingresa nueva tasa"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#d53137] text-white py-3 rounded-lg hover:bg-[#b71c1c] transition-colors font-montserrat-bold disabled:opacity-50 cursor-pointer"
              disabled={rateLoading}
            >
              {rateLoading ? "Guardando..." : "Actualizar Tasa"}
            </button>
          </form>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-4">
        <button
          onClick={() => setHideRejected((prev) => !prev)}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-glass border border-gray-600 rounded-lg text-[#f0f0f0] hover:border-[#d53137] hover:bg-gray-700 transition-colors"
        >
          {hideRejected ? <FaEyeSlash /> : <FaEye />}
          {hideRejected ? "Mostrar rechazadas" : "Ocultar rechazadas"}
        </button>
      </div>

      {!isLoading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
          {visibleRegistrations.map((registration) => (
            <div
              key={registration.id}
              className="p-6 bg-glass rounded-lg border border-gray-700 hover:border-[#d53137] transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start mb-4 truncate">
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-lg font-montserrat-bold text-white mb-1 truncate"
                    title={registration.userInstitution}
                  >
                    {registration.userInstitution}
                  </h3>
                  <p
                    className="text-sm text-gray-400 truncate"
                    title={registration.userEmail}
                  >
                    {registration.userEmail}
                  </p>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 flex-shrink-0 ${getStatusColor(
                    registration.status
                  )}`}
                >
                  {getStatusIcon(registration.status)}
                  {registration.status || "pending"}
                </div>
              </div>

              <div className="space-y-2 mb-4 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <FaUser className="text-[#d53137] flex-shrink-0" />
                  <span
                    className="truncate"
                    title={`${registration.userFirstName} ${registration.userLastName}`}
                  >
                    {registration.userFirstName} {registration.userLastName}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-gray-300">
                  <FaDollarSign className="text-[#d53137] flex-shrink-0" />
                  <span className="truncate">
                    ${registration.amount || 0} USD ({registration.seats} cupos)
                  </span>
                </div>

                {/* Información de asignación */}
                {registration.assignedSeats &&
                  registration.assignedSeats.length > 0 && (
                    <div className="flex items-center gap-2 text-green-400">
                      <FaClipboardList className="text-green-400 flex-shrink-0" />
                      <span className="truncate">
                        {registration.assignedSeats.length} cupos asignados
                      </span>
                    </div>
                  )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  onClick={() => openDetailModal(registration)}
                  className="flex-1 bg-glass cursor-pointer p-4 rounded text-xs flex items-center justify-center gap-1 transition-colors hover:bg-gray-700"
                >
                  <FaEye />
                  Ver detalles
                </button>
              </div>

              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => openAssignmentModal(registration)}
                  className="flex-1 bg-glass cursor-pointer p-4 rounded text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <FaClipboardList />
                  {registration.assignedSeats?.length
                    ? "Editar"
                    : "Asignar"}{" "}
                  Cupos
                </button>

                {registration.assignedSeats &&
                  registration.assignedSeats.length > 0 && (
                    <button
                      onClick={() =>
                        AssignmentsPDFGenerator.downloadAssignmentsPDF(
                          registration,
                          registration.assignedSeats ?? []
                        )
                      }
                      className="flex-1 bg-green-600 hover:bg-green-700 cursor-pointer p-3 rounded text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <CiImport size={16} />
                      PDF Asignación
                    </button>
                  )}
              </div>

              {!(
                registration.assignedSeats &&
                registration.assignedSeats.length > 0
              ) && (
                <div className="flex gap-1">
                  <button
                    onClick={() =>
                      handleStatusUpdate(registration.id, "rejected")
                    }
                    className="flex-1 bg-[#d53137] hover:bg-[#b71c1c] font-montserrat-bold cursor-pointer p-4 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={registration.status === "rejected"}
                  >
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isLoading && registrations.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <FaFileAlt className="mx-auto text-8xl mb-6 opacity-30" />
          <h3 className="text-2xl font-montserrat-bold mb-2">
            No hay inscripciones registradas
          </h3>
          <p className="text-lg">
            Las inscripciones aparecerán aquí cuando los usuarios se registren
          </p>
        </div>
      )}

      {!isLoading &&
        registrations.length > 0 &&
        filteredRegistrations.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <FaFilter className="mx-auto text-8xl mb-6 opacity-30" />
            <h3 className="text-2xl font-montserrat-bold mb-2">
              No se encontraron inscripciones
            </h3>
            <p className="text-lg mb-4">
              Intenta ajustar los filtros o términos de búsqueda
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="bg-[#d53137] text-white px-6 py-3 rounded-lg hover:bg-[#b71c1c] transition-colors"
            >
              Limpiar filtros
            </button>
          </div>
        )}

      <RegistrationsManagementModal
        selectedRegistration={selectedRegistration}
        isOpen={showDetailModal}
        onClose={closeDetailModal}
        onDownloadPDF={handleDownloadPDF}
      />

      <AssignmentsModal
        selectedRegistration={selectedRegistration}
        isOpen={showAssignmentModal}
        onClose={closeAssignmentModal}
      />

      <div className="mt-8 p-4 bg-glass rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-center">
          <div>
            <div className="text-2xl font-montserrat-bold text-[#f0f0f0]">
              {registrations.length}
            </div>
            <div className="text-sm text-gray-400">Total</div>
          </div>
          <div>
            <div className="text-2xl font-montserrat-bold text-yellow-400">
              {
                registrations.filter(
                  (r) => (r.status || "pending") === "pending"
                ).length
              }
            </div>
            <div className="text-sm text-gray-400">Pendientes</div>
          </div>
          <div>
            <div className="text-2xl font-montserrat-bold text-green-400">
              {registrations.filter((r) => r.status === "verified").length}
            </div>
            <div className="text-sm text-gray-400">Verificadas</div>
          </div>
          <div>
            <div className="text-2xl font-montserrat-bold text-red-400">
              {registrations.filter((r) => r.status === "rejected").length}
            </div>
            <div className="text-sm text-gray-400">Rechazadas</div>
          </div>
          <div>
            <div className="text-2xl font-montserrat-bold text-blue-400">
              {
                registrations.filter(
                  (r) => r.assignedSeats && r.assignedSeats.length > 0
                ).length
              }
            </div>
            <div className="text-sm text-gray-400">Con Asignación</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationsManagement;
