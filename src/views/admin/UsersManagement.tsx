import { useState, useEffect, type FC } from "react";
import { Link } from "react-router-dom";
import {
  FaHome,
  FaUser,
  FaEnvelope,
  FaBuilding,
  FaCheckCircle,
  FaTimesCircle,
  FaSearch,
  FaSortAlphaDown,
  FaSortAlphaUp,
  FaClock,
  FaUserShield,
  FaUserTag,
} from "react-icons/fa";
import { FirestoreService } from "../../firebase/firestore";
import type { User } from "../../interfaces/User";
import Loader from "../../components/Loader";
import XButton from "../../components/XButton";

type SortOption = "newest" | "oldest" | "alphabetical" | "reverse-alphabetical";

interface UserWithId extends User {
  id: string;
  createdAt?: string;
}

const UsersManagement: FC = () => {
  const [users, setUsers] = useState<UserWithId[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithId[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [institutions, setInstitutions] = useState<string[]>([]);
  const [institutionFilter, setInstitutionFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<
    "all" | "user" | "faculty" | "admin"
  >("all");
  const [selectedUser, setSelectedUser] = useState<UserWithId | null>(null);
  const [showDetailModal, setShowDetailModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Fetch users from Firestore
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await FirestoreService.getAll<UserWithId>("users");
      setUsers(data);
      // extract unique institutions for the filter
      const uniq = Array.from(
        new Set(data.map((u) => u.institution || "").filter(Boolean))
      ).sort();
      setInstitutions(uniq);
      console.log(`✅ ${data.length} usuarios cargados`);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Sort users
  const sortUsers = (
    usersList: UserWithId[],
    option: SortOption
  ): UserWithId[] => {
    const sorted = [...usersList];
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
          `${a.firstName} ${a.lastName}`.localeCompare(
            `${b.firstName} ${b.lastName}`
          )
        );
      case "reverse-alphabetical":
        return sorted.sort((a, b) =>
          `${b.firstName} ${b.lastName}`.localeCompare(
            `${a.firstName} ${a.lastName}`
          )
        );
      default:
        return sorted;
    }
  };

  // Filter users (search + institution + role)
  const filterUsers = (
    usersList: UserWithId[],
    search: string,
    role: "all" | "user" | "faculty" | "admin",
    institution: string
  ): UserWithId[] => {
    let result = usersList;

    // role filter
    if (role !== "all") {
      if (role === "faculty") result = result.filter((u) => u.isFaculty);
      else if (role === "admin") result = result.filter((u) => u.isAdmin);
      else if (role === "user")
        result = result.filter((u) => !u.isAdmin && !u.isFaculty);
    }

    // institution filter
    if (institution && institution !== "all") {
      const instLower = institution.toLowerCase();
      result = result.filter(
        (u) => (u.institution || "").toLowerCase() === instLower
      );
    }

    // search
    if (!search.trim()) return result;
    const searchLower = search.toLowerCase();
    return result.filter(
      (user) =>
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.institution?.toLowerCase().includes(searchLower)
    );
  };

  useEffect(() => {
    const filtered = filterUsers(
      users,
      searchTerm,
      roleFilter,
      institutionFilter
    );
    const sorted = sortUsers(filtered, sortOption);
    setFilteredUsers(sorted);
  }, [users, sortOption, searchTerm, roleFilter, institutionFilter]);

  const handleSortChange = (option: SortOption) => {
    setSortOption(option);
  };

  const openDetailModal = (user: UserWithId) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedUser(null);
    setShowDeleteConfirm(false);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    try {
      await FirestoreService.delete("users", selectedUser.id);
      console.log(`✅ Usuario ${selectedUser.email} eliminado`);

      // Update local state
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));

      // Close modal
      closeDetailModal();
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      alert("Error al eliminar el usuario. Por favor intenta de nuevo.");
    } finally {
      setIsDeleting(false);
    }
  };

  const sortOptions = [
    { value: "newest" as SortOption, label: "Recientes", icon: <FaClock /> },
    { value: "oldest" as SortOption, label: "Antiguos", icon: <FaClock /> },
    {
      value: "alphabetical" as SortOption,
      label: "A-Z",
      icon: <FaSortAlphaDown />,
    },
    {
      value: "reverse-alphabetical" as SortOption,
      label: "Z-A",
      icon: <FaSortAlphaUp />,
    },
  ];

  const stats = {
    total: users.length,
    faculty: users.filter((u) => u.isFaculty).length,
    admins: users.filter((u) => u.isAdmin).length,
    regular: users.filter((u) => !u.isFaculty && !u.isAdmin).length,
  };

  return (
    <div className="p-12 font-montserrat-light w-full">
      <div className="p-0">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
          <div className="flex flex-col items-start">
            <h1 className="text-4xl font-montserrat-bold">Usuarios</h1>
            <Link
              to="/admin"
              className="px-6 py-2 my-4 bg-glass border border-gray-600 rounded-lg text-[#f0f0f0] hover:border-[#d53137] hover:bg-gray-700 transition-colors flex items-center gap-2 font-medium"
            >
              <FaHome size={16} />
              Panel Admin
            </Link>
            <p className="text-gray-400">Total de usuarios: {users.length}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-glass border border-gray-600 rounded-lg text-[#f0f0f0] focus:border-[#d53137] outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <select
              aria-label="Filtrar por institución"
              value={institutionFilter}
              onChange={(e) => setInstitutionFilter(e.target.value)}
              className="px-4 py-2 bg-glass border border-gray-600 rounded-lg text-[#f0f0f0] font-medium hover:border-gray-500 focus:border-[#d53137] outline-none transition-colors cursor-pointer"
            >
              <option value="all" className="bg-[#0f0f10]">
                Todas las instituciones
              </option>
              {institutions.map((inst) => (
                <option key={inst} value={inst} className="bg-[#0f0f10]">
                  {inst}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtrar por rol"
              value={roleFilter}
              onChange={(e) => {
                const v = e.target.value as
                  | "all"
                  | "user"
                  | "faculty"
                  | "admin";
                setRoleFilter(v);
              }}
              className="px-4 py-2 bg-glass border border-gray-600 rounded-lg text-[#f0f0f0] font-medium hover:border-gray-500 focus:border-[#d53137] outline-none transition-colors cursor-pointer"
            >
              <option value="all" className="bg-[#0f0f10]">
                Todos los roles
              </option>
              <option value="user" className="bg-[#0f0f10]">
                Usuario
              </option>
              <option value="faculty" className="bg-[#0f0f10]">
                Faculty
              </option>
              <option value="admin" className="bg-[#0f0f10]">
                Admin
              </option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-glass p-4 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3">
              <FaUser className="text-3xl text-blue-400" />
              <div>
                <div className="text-2xl font-montserrat-bold">
                  {stats.total}
                </div>
                <div className="text-sm text-gray-400">Total</div>
              </div>
            </div>
          </div>

          <div className="bg-glass p-4 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3">
              <FaUserTag className="text-3xl text-green-400" />
              <div>
                <div className="text-2xl font-montserrat-bold">
                  {stats.faculty}
                </div>
                <div className="text-sm text-gray-400">Faculty</div>
              </div>
            </div>
          </div>

          <div className="bg-glass p-4 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3">
              <FaUserShield className="text-3xl text-red-400" />
              <div>
                <div className="text-2xl font-montserrat-bold">
                  {stats.admins}
                </div>
                <div className="text-sm text-gray-400">Admins</div>
              </div>
            </div>
          </div>

          <div className="bg-glass p-4 rounded-lg border border-gray-700">
            <div className="flex items-center gap-3">
              <FaUser className="text-3xl text-gray-400" />
              <div>
                <div className="text-2xl font-montserrat-bold">
                  {stats.regular}
                </div>
                <div className="text-sm text-gray-400">Regulares</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sort Options */}
        {!isLoading && users.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="text-sm text-gray-300 font-medium">
              Ordenar por:
            </span>
            <div className="flex gap-2 flex-wrap">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortChange(option.value)}
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

        {isLoading && <Loader message="Cargando usuarios..." />}

        {/* Users Table */}
        {!isLoading && (
          <>
            {filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full bg-glass border border-gray-700 rounded-lg">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="px-6 py-4 text-left text-sm font-montserrat-bold text-gray-300">
                        Usuario
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-montserrat-bold text-gray-300">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-montserrat-bold text-gray-300">
                        Institución
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-montserrat-bold text-gray-300">
                        Roles
                      </th>
                      {/* Fecha de registro removed per request */}
                      <th className="px-6 py-4 text-center text-sm font-montserrat-bold text-gray-300">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <tr
                        key={user.id}
                        className={`border-b border-gray-700 hover:bg-gray-800/50 transition-colors ${
                          index % 2 === 0 ? "bg-gray-900/20" : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#d53137] flex items-center justify-center flex-shrink-0">
                              <FaUser className="text-white" />
                            </div>
                            <div>
                              <p className="font-montserrat-bold text-white">
                                {user.firstName} {user.lastName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-300 break-words max-w-xs">
                            {user.email}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-300">
                            {user.institution}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 flex-wrap">
                            {user.isFaculty && (
                              <span className="text-xs bg-green-900/20 text-green-400 px-2 py-1 rounded border border-green-600 whitespace-nowrap">
                                Faculty
                              </span>
                            )}
                            {user.isAdmin && (
                              <span className="text-xs bg-red-900/20 text-red-400 px-2 py-1 rounded border border-red-600 whitespace-nowrap">
                                Admin
                              </span>
                            )}
                            {!user.isFaculty && !user.isAdmin && (
                              <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded whitespace-nowrap">
                                Usuario
                              </span>
                            )}
                          </div>
                        </td>
                        {/* Fecha de registro column removed */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => openDetailModal(user)}
                            className="cursor-pointer px-4 py-2 bg-[#d53137] hover:bg-[#b92830] text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            Ver detalles
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FaUser className="mx-auto text-6xl text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">
                  {searchTerm.trim()
                    ? "No se encontraron usuarios con ese término de búsqueda"
                    : "No hay usuarios registrados"}
                </p>
              </div>
            )}
          </>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedUser && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={closeDetailModal}
          >
            <div
              className="bg-[#0f0f10] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-700 flex items-center justify-between">
                <h2 className="text-2xl font-montserrat-bold">
                  Detalles del Usuario
                </h2>
                <button
                  aria-label="close"
                  onClick={closeDetailModal}
                  className="cursor-pointer text-gray-400 hover:text-white text-2xl"
                >
                  <XButton />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* User Info */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#d53137] flex items-center justify-center">
                    <FaUser className="text-white text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-montserrat-bold">
                      {selectedUser.firstName} {selectedUser.lastName}
                    </h3>
                    <p className="text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-glass p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FaEnvelope className="text-gray-400" />
                      <span className="text-sm text-gray-400">Email</span>
                    </div>
                    <p
                      className="font-montserrat-bold break-words truncate max-w-full"
                      title={selectedUser.email}
                    >
                      {selectedUser.email}
                    </p>
                  </div>

                  <div className="bg-glass p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FaBuilding className="text-gray-400" />
                      <span className="text-sm text-gray-400">Institución</span>
                    </div>
                    <p className="font-montserrat-bold">
                      {selectedUser.institution}
                    </p>
                  </div>

                  <div className="bg-glass p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FaUserTag className="text-gray-400" />
                      <span className="text-sm text-gray-400">Faculty</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedUser.isFaculty ? (
                        <FaCheckCircle className="text-green-400" />
                      ) : (
                        <FaTimesCircle className="text-red-400" />
                      )}
                      <span className="font-montserrat-bold">
                        {selectedUser.isFaculty ? "Sí" : "No"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-glass p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <FaUserShield className="text-gray-400" />
                      <span className="text-sm text-gray-400">Admin</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedUser.isAdmin ? (
                        <FaCheckCircle className="text-green-400" />
                      ) : (
                        <FaTimesCircle className="text-red-400" />
                      )}
                      <span className="font-montserrat-bold">
                        {selectedUser.isAdmin ? "Sí" : "No"}
                      </span>
                    </div>
                  </div>

                  {selectedUser.createdAt && (
                    <div className="bg-glass p-4 rounded-lg md:col-span-2">
                      <div className="flex items-center gap-2 mb-2">
                        <FaClock className="text-gray-400" />
                        <span className="text-sm text-gray-400">
                          Fecha de registro
                        </span>
                      </div>
                      <p className="font-montserrat-bold">
                        {new Date(selectedUser.createdAt).toLocaleString(
                          "es-ES"
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Firebase UID */}
                <div className="bg-glass p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FaUser className="text-gray-400" />
                    <span className="text-sm text-gray-400">
                      ID de Firebase
                    </span>
                  </div>
                  <p className="font-mono text-sm text-gray-300 break-all">
                    {selectedUser.id}
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-gray-700 flex justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="cursor-pointer px-6 py-2 bg-[#d53137] hover:bg-red-700 text-white rounded-lg transition-colors font-medium mr-3"
                >
                  Eliminar usuario
                </button>
                <button
                  onClick={closeDetailModal}
                  className="cursor-pointer px-6 py-2 bg-glass hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedUser && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              className="bg-[#0f0f10] rounded-lg max-w-md w-full border border-red-600"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-2xl font-montserrat-bold text-red-400">
                  ⚠️ Confirmar eliminación
                </h2>
              </div>

              <div className="p-6">
                <p className="text-gray-300 mb-4">
                  ¿Estás seguro de que deseas eliminar a este usuario?
                </p>
                <div className="bg-glass p-4 rounded-lg mb-4">
                  <p className="font-montserrat-bold text-white">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </p>
                  <p className="text-sm text-gray-400">{selectedUser.email}</p>
                </div>
                <p className="text-sm text-red-400">
                  Esta acción no se puede deshacer.
                </p>
              </div>

              <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="cursor-pointer px-6 py-2 bg-glass hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="cursor-pointer px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Eliminando..." : "Eliminar usuario"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersManagement;
