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
          dateStr: new Date(log.created_at).toLocaleDateString("fr-FR"), 
          tasks: task ? { name: task.name, room: task.room } : { name: "Tâche introuvable", room: "Inconnue" },
          users: user ? { name: user.name } : { name: "Inconnu" }
        };
      });
      
      setLogs(formattedLogs);

      const today = new Date().toLocaleDateString("fr-FR");
      const uniqueDates = Array.from(new Set(formattedLogs.map(log => log.dateStr)));
      setCollapsedDates(uniqueDates.filter(date => date !== today));
    }
    
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const taskName = log.tasks?.name?.toLowerCase() || "";
    const userName = log.users?.name?.toLowerCase() || "";
    const roomName = log.tasks?.room || "";

    const matchesSearch = taskName.includes(searchTerm.toLowerCase()) || userName.includes(searchTerm.toLowerCase());
    const matchesRoom = selectedRoom === "Toutes les pièces" || roomName === selectedRoom;

    return matchesSearch && matchesRoom;
  });

  const groupedLogs = filteredLogs.reduce((acc, log) => {
    if (!acc[log.dateStr]) acc[log.dateStr] = [];
    acc[log.dateStr].push(log);
    return acc;
  }, {} as Record<string, typeof filteredLogs>);

  const sortedDates = Object.keys(groupedLogs);

  const toggleDate = (date: string) => {
    if (collapsedDates.includes(date)) {
      setCollapsedDates(collapsedDates.filter(d => d !== date));
    } else {
      setCollapsedDates([...collapsedDates, date]);
    }
  };

  return (
    <div className="min-h-screen relative w-full">
      <div className="absolute top-6 left-6 z-10">
        <button 
          onClick={() => router.push("/")}
          className="text-[10px] text-stone-400 hover:text-stone-800 uppercase tracking-widest font-medium transition-colors"
        >
          ◀ Retour
        </button>
      </div>

      <div className="w-full max-w-2xl mx-auto px-6 pb-12 pt-24">
        <h1 className="font-title text-6xl text-center mb-12 text-stone-800 capitalize">
  Historique
</h1>

        <div className="flex flex-col gap-4 mb-10 glass-card p-6 rounded-[2rem]">
          <input 
            type="text" 
            placeholder="Rechercher un mot (ex: Liam, Aspirateur)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/50 border border-stone-200 p-3 rounded-xl font-light text-sm focus:outline-none focus:ring-1 focus:ring-stone-400 placeholder:text-stone-400"
          />
          <select 
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="w-full bg-white/50 border border-stone-200 p-3 rounded-xl font-medium uppercase tracking-wider text-xs focus:outline-none focus:ring-1 focus:ring-stone-400 text-stone-700"
          >
            {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-6">
          {sortedDates.length === 0 ? (
            <p className="text-center text-stone-400 font-light mt-4">Aucun historique trouvé.</p>
          ) : (
            sortedDates.map((date) => {
              const isCollapsed = collapsedDates.includes(date);
              const dayLogs = groupedLogs[date];
              const today = new Date().toLocaleDateString("fr-FR");
              const displayTitle = date === today ? "Aujourd'hui" : date;

              return (
                <div key={date} className="w-full glass-card p-6 rounded-[2rem] transition-all">
                  
                  <div 
                    className={`flex justify-between items-center cursor-pointer ${isCollapsed ? '' : 'border-b border-stone-200/60 pb-5 mb-5'}`}
                    onClick={() => toggleDate(date)}
                  >
                    <div className="flex items-center gap-3 select-none">
                      <span className="text-sm text-stone-300">{isCollapsed ? '▶' : '▼'}</span>
                      <h2 className="text-lg font-medium uppercase tracking-wide text-stone-800">{displayTitle}</h2>
                    </div>
                    
                    <span className="text-[10px] font-medium text-stone-500 uppercase tracking-widest bg-white/60 px-3 py-1 rounded-full border border-stone-200/50">
                      {dayLogs.length} tâche{dayLogs.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {!isCollapsed && (
                    <div className="flex flex-col gap-3">
                      {dayLogs.map((log) => (
                        <div key={log.id} className="bg-white/40 border border-stone-100 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                          <p className="font-light text-sm text-stone-700 leading-relaxed">
                            <span className="font-medium text-stone-900">{log.users?.name}</span> a fait <span className="font-medium lowercase text-stone-900">{log.tasks?.name}</span> dans la <span className="font-medium lowercase text-stone-900">{log.tasks?.room}</span>
                          </p>
                          <span className="text-[9px] font-medium uppercase tracking-widest text-stone-500 bg-stone-100/80 px-2 py-1 rounded shrink-0 self-start sm:self-auto">
                            {log.tasks?.room}
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