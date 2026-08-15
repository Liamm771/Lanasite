"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const ROOMS = [
  "Toutes les pièces", "Cuisine", "Salon", "Toilettes", "Salle de Bain", 
  "Chambre", "Chambre Gaming", "Couloir", "Garage", "Jardin"
];

export default function Historique() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(ROOMS[0]);

  // Nouvel état pour gérer les jours réduits/ouverts
  const [collapsedDates, setCollapsedDates] = useState<string[]>([]);

  useEffect(() => {
    async function fetchLogs() {
      const { data: logsData } = await supabase.from("logs").select("*").order("created_at", { ascending: false });
      const { data: tasksData } = await supabase.from("tasks").select("*");
      const { data: usersData } = await supabase.from("users").select("*");

      const safeLogs = logsData || [];
      const safeTasks = tasksData || [];
      const safeUsers = usersData || [];

      const formattedLogs = safeLogs.map(log => {
        const task = safeTasks.find(t => t.id == log.task_id);
        const user = safeUsers.find(u => u.id == log.user_id);
        
        return {
          id: log.id,
          created_at: log.created_at,
          // On génère la date au format français (ex: 15/08/2026) pour s'en servir de catégorie
          dateStr: new Date(log.created_at).toLocaleDateString("fr-FR"), 
          tasks: task ? { name: task.name, room: task.room } : { name: "Tâche introuvable", room: "Inconnue" },
          users: user ? { name: user.name } : { name: "Inconnu" }
        };
      });
      
      setLogs(formattedLogs);

      // Logique pour fermer tous les jours sauf aujourd'hui
      const today = new Date().toLocaleDateString("fr-FR");
      const uniqueDates = Array.from(new Set(formattedLogs.map(log => log.dateStr)));
      // On met toutes les dates dans "collapsedDates" SAUF la date d'aujourd'hui
      setCollapsedDates(uniqueDates.filter(date => date !== today));
    }
    
    fetchLogs();
  }, []);

  // On filtre d'abord selon la barre de recherche et la pièce
  const filteredLogs = logs.filter((log) => {
    const taskName = log.tasks?.name?.toLowerCase() || "";
    const userName = log.users?.name?.toLowerCase() || "";
    const roomName = log.tasks?.room || "";

    const matchesSearch = taskName.includes(searchTerm.toLowerCase()) || userName.includes(searchTerm.toLowerCase());
    const matchesRoom = selectedRoom === "Toutes les pièces" || roomName === selectedRoom;

    return matchesSearch && matchesRoom;
  });

  // Ensuite, on groupe les logs filtrés par date
  const groupedLogs = filteredLogs.reduce((acc, log) => {
    if (!acc[log.dateStr]) {
      acc[log.dateStr] = [];
    }
    acc[log.dateStr].push(log);
    return acc;
  }, {} as Record<string, typeof filteredLogs>);

  // On récupère les dates (elles sont déjà dans le bon ordre chronologique inversé)
  const sortedDates = Object.keys(groupedLogs);

  const toggleDate = (date: string) => {
    if (collapsedDates.includes(date)) {
      setCollapsedDates(collapsedDates.filter(d => d !== date));
    } else {
      setCollapsedDates([...collapsedDates, date]);
    }
  };

  return (
    <div className="min-h-screen relative font-sans text-black bg-white w-full">
      <div className="absolute top-4 left-4 z-10">
        <button 
          onClick={() => router.push("/")}
          className="text-xs text-gray-400 hover:text-black uppercase tracking-wider font-bold transition-colors"
        >
          ◀ Retour
        </button>
      </div>

      <div className="w-full max-w-2xl mx-auto px-4 pb-8 pt-20">
        <h1 className="text-4xl font-black tracking-widest text-center uppercase mb-8">
          HISTORIQUE
        </h1>

        <div className="flex flex-col gap-3 mb-8 border-[3px] border-black p-4 rounded-lg bg-gray-50">
          <input 
            type="text" 
            placeholder="Rechercher un mot (ex: Liam, Aspirateur)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-2 border-black p-3 rounded-md font-medium text-sm"
          />
          <select 
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="w-full border-2 border-black p-3 rounded-md font-bold uppercase tracking-wider text-sm bg-white"
          >
            {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* AFFICHAGE GROUPÉ PAR JOUR */}
        <div className="flex flex-col gap-6">
          {sortedDates.length === 0 ? (
            <p className="text-center text-gray-400 font-bold mt-4">Aucun historique trouvé.</p>
          ) : (
            sortedDates.map((date) => {
              const isCollapsed = collapsedDates.includes(date);
              const dayLogs = groupedLogs[date];
              
              // On vérifie si la date est aujourd'hui pour afficher "Aujourd'hui" au lieu de "15/08/2026"
              const today = new Date().toLocaleDateString("fr-FR");
              const displayTitle = date === today ? "Aujourd'hui" : date;

              return (
                <div key={date} className="w-full border-[3px] border-black p-5 bg-white rounded-lg shadow-sm transition-all">
                  
                  {/* EN-TÊTE DE L'ACCORDÉON (LA DATE) */}
                  <div 
                    className={`flex justify-between items-center cursor-pointer ${isCollapsed ? '' : 'border-b-2 border-black pb-4 mb-4'}`}
                    onClick={() => toggleDate(date)}
                  >
                    <div className="flex items-center gap-3 select-none">
                      <span className="text-xl text-gray-400">{isCollapsed ? '▶' : '▼'}</span>
                      <h2 className="text-2xl font-bold uppercase">{displayTitle}</h2>
                    </div>
                    
                    {/* Petit compteur du nombre de tâches faites ce jour-là */}
                    <span className="text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                      {dayLogs.length} tâche{dayLogs.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {/* CONTENU (LES LOGS DU JOUR) */}
                  {!isCollapsed && (
                <div className="flex flex-col gap-3">
                  {dayLogs.map((log: {
                    id: string;
                    users?: { name?: string | null } | null;
                    tasks?: { name?: string | null; room?: string | null } | null;
                  }) => (
                    <div key={log.id} className="border-2 border-gray-200 p-3 rounded-md bg-gray-50 flex items-center justify-between gap-4">
                      <p className="font-medium text-base leading-snug">
                        <span className="font-black">{log.users?.name}</span> a fait <span className="font-bold lowercase">{log.tasks?.name}</span> dans la <span className="font-bold lowercase">{log.tasks?.room}</span>
                      </p>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-gray-200 text-gray-600 px-2 py-1 rounded shrink-0">
                        {log.tasks?.room}
                      </span>
                    </div>
                  ))}
                </div>
              )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}