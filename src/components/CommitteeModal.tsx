import type { FC } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import XButton from "./XButton";
import type { Committee } from "../interfaces/Committee";
import { FaCheck, FaTimes } from "react-icons/fa";

const CommitteeModal: FC<{
  committee: Committee;
  onClose: () => void;
}> = ({ committee, onClose }) => {
  return (
    <motion.div
      className="bg-[#101010] w-[95vw] md:w-[80vw] max-w-6xl text-black rounded-lg p-4 relative flex flex-col md:flex-row max-h-[95vh] md:max-h-[90vh] overflow-y-auto md:overflow-hidden"
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <button
        className="absolute top-4 left-4 z-10 cursor-pointer"
        aria-label="Cerrar comité"
        onClick={onClose}
      >
        <XButton size={40} />
      </button>

      <div className="text-[#f0f0f0] flex flex-col items-center font-montserrat-light rounded-lg p-4 md:p-8 w-full md:w-1/2 md:overflow-y-auto">
        <img
          className="w-full max-w-sm h-auto rounded-lg mb-4"
          src={committee.img}
          alt={committee.name}
        />
        <h1 className="font-montserrat-bold text-2xl md:text-4xl text-center mb-4">
          {committee.name}
        </h1>

        <div className="w-full space-y-2 mb-4">
          <p className="text-sm md:text-base">
            <span className="font-montserrat-bold">Tópico:</span>{" "}
            {committee.topic}
          </p>

          <p className="text-sm md:text-base">
            <span className="font-montserrat-bold">Presidente:</span>{" "}
            {committee.president || "Próximamente disponible"}
          </p>

          <p className="text-sm md:text-base">
            <span className="font-montserrat-bold">Cupos:</span>{" "}
            {committee.seats}
          </p>

          {committee.seatsList && (
            <p className="text-sm md:text-base">
              <span className="font-montserrat-bold">Disponibles:</span>{" "}
              <span className="text-green-400">
                {committee.seatsList.filter((seat) => seat.available).length}
              </span>{" "}
              / {committee.seats}
            </p>
          )}
        </div>

        {committee.description && (
          <div className="w-full">
            <h3 className="text-lg font-montserrat-bold mb-2">Descripción</h3>
            <p className="text-sm md:text-base text-left leading-relaxed">
              {committee.description}
            </p>
          </div>
        )}
      </div>

      <div className="text-[#f0f0f0] w-full md:w-1/2 flex flex-col p-4 md:p-8 md:overflow-y-auto">
        <video
          className="w-full rounded-lg shadow-lg cursor-pointer mb-6"
          controls
          src={committee.video || "/videos/XVI ROBLESMUN INAUGURACION.mp4"}
        />

        <div className="space-y-6">
          <div>
            <Link
              className="inline-block my-4 px-6 py-3 w-full text-center bg-glass font-montserrat-bold rounded transition-colors duration-200 hover:bg-opacity-80"
              to="/registrations"
            >
              Inscribirse
            </Link>

            <h3 className="text-lg font-montserrat-bold mb-3">
              Guía de estudio
            </h3>
            {committee.studyGuide ? (
              <a
                className="text-sm font-montserrat-light underline break-words hover:text-blue-300 transition-colors"
                href={committee.studyGuide}
                target="_blank"
                rel="noopener noreferrer"
              >
                {committee.studyGuide}
              </a>
            ) : (
              <p className="text-sm text-gray-300">¡Próximamente disponible!</p>
            )}
          </div>

          <div>
            <h3 className="text-lg font-montserrat-bold mb-3">
              Basamentos jurídicos
            </h3>
            {committee.legalFramework && committee.legalFramework.length > 0 ? (
              <ul className="list-disc list-inside">
                {committee.legalFramework.map((link, index) => (
                  <li key={index}>
                    <a
                      className="text-sm font-montserrat-light underline break-words hover:text-blue-300 transition-colors"
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-300">¡Próximamente disponible!</p>
            )}
          </div>

          {/* Lista de Cupos */}
          {committee.seatsList && committee.seatsList.length > 0 && (
            <div>
              <h3 className="text-lg font-montserrat-bold mb-3">
                Lista de Cupos
              </h3>
              <div className="max-h-64 overflow-y-auto bg-glass rounded-lg p-3 space-y-2">
                {committee.seatsList.map((seat, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded text-sm transition-colors ${
                      seat.available
                        ? "bg-green-900/20 hover:bg-green-900/30 border border-green-700/30"
                        : "bg-red-900/20 hover:bg-red-900/30 border border-red-700/30"
                    }`}
                  >
                    <span
                      className={`font-montserrat-light ${
                        seat.available ? "text-green-300" : "text-red-300"
                      }`}
                    >
                      {seat.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {seat.available ? (
                        <>
                          <FaCheck className="text-green-400" />
                          <span className="text-xs text-green-400 font-montserrat-bold">
                            Disponible
                          </span>
                        </>
                      ) : (
                        <>
                          <FaTimes className="text-red-400" />
                          <span className="text-xs text-red-400 font-montserrat-bold">
                            Ocupado
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CommitteeModal;
