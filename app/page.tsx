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
          frequency_days: t.frequency_days,
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
    <div className="min-h-screen w-full relative">
      
      <div className="absolute top-6 left-6 flex flex-col items-start gap-3 z-10">
        <button 
          onClick={handleLogout}
          className="text-[10px] text-stone-400 hover:text-stone-800 uppercase tracking-widest font-medium transition-colors"
        >
          Déconnexion
        </button>
        <button 
          onClick={() => router.push("/historique")}
          className="text-[10px] text-stone-400 hover:text-stone-800 uppercase tracking-widest font-medium transition-colors"
        >
          Historique
        </button>
        {isAdmin && (
          <button 
            onClick={() => router.push("/gerer")}
            className="text-[10px] text-stone-400 hover:text-stone-800 uppercase tracking-widest font-medium transition-colors"
          >
            Gérer
          </button>
        )}
      </div>

      <div className="w-full max-w-2xl mx-auto px-6 pb-12 pt-24">
        
        <p className="font-title text-6xl text-center mb-16 text-stone-800 capitalize">
  Ménage
</p>

        <main className="flex flex-col gap-6 w-full">
          {ROOMS.map((room) => {
            const roomTasks = tasks.filter(t => t.room === room);
            if (roomTasks.length === 0) return null;
            
            const isRoomDone = roomTasks.length > 0 && roomTasks.every(t => t.done);
            const isCollapsed = collapsedRooms.includes(room);

            return (
              <div key={room} className="w-full glass-card rounded-[2rem] p-6 transition-all duration-300">
                
                <div 
                  className={`flex justify-between items-center cursor-pointer ${isCollapsed ? '' : 'border-b border-stone-200/60 pb-5 mb-5'}`}
                  onClick={() => toggleRoom(room)}
                >
                  <div className="flex items-center gap-3 select-none">
                    <span className="text-sm text-stone-300">{isCollapsed ? '▶' : '▼'}</span>
                    <h2 className="text-lg font-medium tracking-wide uppercase text-stone-800">{room}</h2>
                  </div>
                  
                  <input 
                    type="checkbox" 
                    checked={isRoomDone}
                    readOnly
                    className="w-5 h-5 rounded-md border-stone-300 accent-stone-800 pointer-events-none opacity-50"
                  />
                </div>
                
                {!isCollapsed && (
                  <div className="flex flex-col gap-4">
                    {roomTasks.map((task) => (
                      <div key={task.id} className="flex flex-col gap-1 pb-4 border-b border-stone-100 last:border-0 last:pb-0">
                        
                        <div className="flex justify-between items-start">
                          <span className="text-base font-light text-stone-800">{task.name}</span>
                          <span className="text-[10px] font-medium text-stone-400 bg-stone-100/50 px-2 py-1 rounded-full">
                            Tous les {task.frequency_days}j
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center w-full mt-1">
                          {task.done ? (
                            <span className="text-[11px] text-stone-400 uppercase tracking-widest">
                              Réalisé le {task.date} par {task.user}
                            </span>
                          ) : (
                            <span className="text-[11px] text-stone-800 font-medium uppercase tracking-widest">
                              À faire
                            </span>
                          )}
                          <input 
                            type="checkbox" 
                            checked={task.done}
                            onChange={() => toggleTask(task)}
                            className="w-6 h-6 rounded-md border-stone-300 cursor-pointer accent-stone-800 shrink-0 transition-transform active:scale-95"
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

        <div className="mt-16 flex justify-center w-full">
          <button className="w-full bg-stone-800 text-white px-6 py-5 text-sm font-medium uppercase tracking-[0.2em] rounded-full active:bg-stone-700 transition-all shadow-xl shadow-stone-800/10 hover:-translate-y-0.5">
            Envoyer
          </button>
        </div>

      </div>
    </div>
  );
}