"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const ROOMS = [
  "Cuisine", "Salon", "Toilettes", "Salle de Bain", 
  "Chambre", "Chambre Gaming", "Couloir", "Garage", "Jardin"
];

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null);
  
  const [tasks, setTasks] = useState<any[]>([]);
  const [collapsedRooms, setCollapsedRooms] = useState<string[]>(ROOMS);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    } 
    
    setCurrentUser(JSON.parse(userStr));
    loadTasks();
  }, [router]);

  async function loadTasks() {
    // MODIFICATION ICI : On ajoute le tri par fréquence croissante (ascending: true)
    const { data: tasksData, error: taskError } = await supabase.from("tasks").select("*").order("frequency_days", { ascending: true });
    const { data: logsData, error: logError } = await supabase.from("logs").select("*").order("created_at", { ascending: false });
    const { data: usersData, error: userError } = await supabase.from("users").select("*");
    
    if (taskError) console.error("Erreur tâches:", taskError.message);
    if (logError) console.error("Erreur logs:", logError.message);
    if (userError) console.error("Erreur utilisateurs:", userError.message);

    if (tasksData) {
      const realTasks = tasksData.map((t: any) => {
        const latestLog = (logsData || []).find(l => l.task_id === t.id);
        
        let isDone = false;
        let dateStr = undefined;
        let userName = undefined;
        let logId = undefined;

        if (latestLog) {
          const doneDate = new Date(latestLog.created_at);
          const expireDate = new Date(doneDate);
          expireDate.setDate(expireDate.getDate() + t.frequency_days);
          expireDate.setHours(23, 59, 59, 999);

          const now = new Date();

          if (now <= expireDate) {
            isDone = true;
            dateStr = doneDate.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
            const user = (usersData || []).find(u => u.id === latestLog.user_id);
            userName = user ? user.name : "Inconnu";
            logId = latestLog.id;
          }
        }

        return {
          id: t.id,
          room: t.room,
          name: t.name,
          frequency_days: t.frequency_days, // On conserve l'info
          done: isDone,
          date: dateStr,
          user: userName,
          logId: logId
        };
      });
      
      setTasks(realTasks);
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/login");
  };

  const toggleTask = async (task: any) => {
    if (!currentUser) return;

    if (!task.done) {
      const { error } = await supabase
        .from("logs")
        .insert([{ task_id: task.id, user_id: currentUser.id }]);
      
      if (error) {
        alert("Erreur (Cocher) : " + error.message);
      } else {
        loadTasks(); 
      }
    } else {
      if (task.logId) {
        const { error } = await supabase
          .from("logs")
          .delete()
          .eq("id", task.logId);
          
        if (error) {
          alert("Erreur (Décocher) : " + error.message);
        } else {
          loadTasks();
        }
      }
    }
  };

  const toggleRoom = (roomName: string) => {
    if (collapsedRooms.includes(roomName)) {
      setCollapsedRooms(collapsedRooms.filter(r => r !== roomName));
    } else {
      setCollapsedRooms([...collapsedRooms, roomName]);
    }
  };

  if (!currentUser) return null;

  const isAdmin = currentUser.role === "admin";

  return (
    <div className="min-h-screen relative font-sans text-black bg-white w-full">
      
      <div className="absolute top-4 left-4 flex flex-col items-start gap-2 z-10">
        <button 
          onClick={handleLogout}
          className="text-xs text-gray-400 hover:text-black uppercase tracking-wider font-bold transition-colors"
        >
          Déconnexion
        </button>
        <button 
          onClick={() => router.push("/historique")}
          className="text-xs text-gray-400 hover:text-black uppercase tracking-wider font-bold transition-colors"
        >
          Historique
        </button>
        {isAdmin && (
          <button 
            onClick={() => router.push("/gerer")}
            className="text-xs text-gray-400 hover:text-black uppercase tracking-wider font-bold transition-colors"
          >
            Gérer
          </button>
        )}
      </div>

      <div className="w-full max-w-2xl mx-auto px-4 pb-8 pt-20">
        
        <h1 className="text-5xl font-black tracking-widest text-center uppercase mb-10">
          Au service de Maitresse
        </h1>

        <main className="flex flex-col gap-6 w-full">
          {ROOMS.map((room) => {
            // Les tâches de cette pièce arrivent déjà triées par fréquence grâce à Supabase
            const roomTasks = tasks.filter(t => t.room === room);
            if (roomTasks.length === 0) return null;
            
            const isRoomDone = roomTasks.length > 0 && roomTasks.every(t => t.done);
            const isCollapsed = collapsedRooms.includes(room);

            return (
              <div key={room} className="w-full border-[3px] border-black p-5 bg-white rounded-lg shadow-sm transition-all">
                
                <div 
                  className={`flex justify-between items-center cursor-pointer ${isCollapsed ? '' : 'border-b-2 border-black pb-4 mb-4'}`}
                  onClick={() => toggleRoom(room)}
                >
                  <div className="flex items-center gap-3 select-none">
                    <span className="text-xl text-gray-400">{isCollapsed ? '▶' : '▼'}</span>
                    <h2 className="text-2xl font-bold">{room}</h2>
                  </div>
                  
                  <input 
                    type="checkbox" 
                    checked={isRoomDone}
                    readOnly
                    className="w-7 h-7 border-2 border-black rounded-sm accent-black pointer-events-none"
                  />
                </div>
                
                {!isCollapsed && (
                  <div className="flex flex-col gap-5">
                    {roomTasks.map((task) => (
                      <div key={task.id} className="flex flex-col gap-2 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                        
                        <div className="flex justify-between items-start">
                          <span className="text-xl font-medium">{task.name}</span>
                          {/* Optionnel mais pratique : on affiche discrètement la récurrence */}
                          <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                            Tous les {task.frequency_days}j
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center w-full mt-1">
                          {task.done ? (
                            <span className="text-sm text-gray-500">
                              Réalisé le {task.date} par {task.user}
                            </span>
                          ) : (
                            <span className="text-sm text-black font-bold uppercase tracking-wide">
                              À faire
                            </span>
                          )}
                          <input 
                            type="checkbox" 
                            checked={task.done}
                            onChange={() => toggleTask(task)}
                            className="w-8 h-8 border-2 border-black cursor-pointer rounded-sm accent-black shrink-0"
                          />
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </main>

        <div className="mt-12 flex justify-center w-full">
          <button className="w-full border-[3px] border-black bg-black text-white px-6 py-4 text-xl font-bold uppercase tracking-wider rounded-lg active:bg-gray-800 transition-colors">
            Envoyer
          </button>
        </div>

      </div>
    </div>
  );
}