"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

const ROOMS = [
  "Cuisine", "Salon", "Toilettes", "Salle de Bain", 
  "Chambre", "Chambre Gaming", "Couloir", "Garage", "Jardin"
];

export default function Gerer() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"menage" | "profils">("menage");

  const [tasks, setTasks] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [room, setRoom] = useState(ROOMS[0]);
  const [frequency, setFrequency] = useState<number | "">(1);
  const [errorMenage, setErrorMenage] = useState("");
  const [collapsedRooms, setCollapsedRooms] = useState<string[]>(ROOMS);

  const [users, setUsers] = useState<any[]>([]);
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [errorProfil, setErrorProfil] = useState("");
  const [updatedPasswords, setUpdatedPasswords] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== "admin") {
      router.push("/");
      return;
    }

    fetchTasks();
    fetchUsers();
  }, [router]);

  async function fetchTasks() {
    const { data } = await supabase.from("tasks").select("*").order("room");
    if (data) setTasks(data);
  }

  async function fetchUsers() {
    const { data } = await supabase.from("users").select("*").order("name");
    if (data) setUsers(data);
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMenage("");

    if (!name.trim()) {
      setErrorMenage("Le nom de la tâche est obligatoire.");
      return;
    }

    let finalFreq = frequency === "" ? 1 : frequency;
    if (finalFreq < 1) finalFreq = 1;
    if (finalFreq > 30) finalFreq = 30;

    const { data, error: insertError } = await supabase
      .from("tasks")
      .insert([{ name, room, frequency_days: finalFreq }])
      .select();

    if (insertError) {
      setErrorMenage("Erreur lors de l'ajout : " + insertError.message);
    } else if (data) {
      setTasks([...tasks, data[0]]);
      setName(""); 
      setFrequency(1); 
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm("Supprimer cette tâche ?")) {
      await supabase.from("tasks").delete().eq("id", id);
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const toggleRoom = (roomName: string) => {
    if (collapsedRooms.includes(roomName)) {
      setCollapsedRooms(collapsedRooms.filter(r => r !== roomName));
    } else {
      setCollapsedRooms([...collapsedRooms, roomName]);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorProfil("");

    if (!newUserName.trim() || !newUserPassword.trim()) {
      setErrorProfil("Nom et mot de passe requis.");
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .insert([{ name: newUserName, password: newUserPassword, role: "user" }])
      .select();

    if (error) {
      setErrorProfil("Erreur : " + error.message);
    } else if (data) {
      setUsers([...users, data[0]]);
      setNewUserName("");
      setNewUserPassword("");
    }
  };

  const handleDeleteUser = async (id: string, userName: string) => {
    if (userName.toLowerCase() === "lana") {
      alert("Le compte administrateur principal ne peut pas être supprimé.");
      return;
    }
    if (window.confirm(`Es-tu sûr de vouloir supprimer le profil de ${userName} ?`)) {
      await supabase.from("users").delete().eq("id", id);
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleUpdatePassword = async (id: string, userName: string) => {
    const newPass = updatedPasswords[id];
    if (!newPass || !newPass.trim()) return;

    const { error } = await supabase.from("users").update({ password: newPass }).eq("id", id);
    
    if (error) {
      alert("Erreur lors du changement : " + error.message);
    } else {
      alert(`Mot de passe mis à jour pour ${userName} !`);
      setUpdatedPasswords({ ...updatedPasswords, [id]: "" });
      fetchUsers();
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
  Gestion
</h1>

        {/* NAVIGATION DES ONGLETS (Style Pilule) */}
        <div className="flex bg-stone-200/50 rounded-full p-1.5 mb-10 mx-auto max-w-sm">
          <button 
            onClick={() => setActiveTab("menage")}
            className={`flex-1 py-3 text-xs font-medium uppercase tracking-[0.15em] rounded-full transition-all ${activeTab === "menage" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
          >
            Ménage
          </button>
          <button 
            onClick={() => setActiveTab("profils")}
            className={`flex-1 py-3 text-xs font-medium uppercase tracking-[0.15em] rounded-full transition-all ${activeTab === "profils" ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800"}`}
          >
            Profils
          </button>
        </div>


        {/* ==================== ONGLET : MÉNAGE ==================== */}
        {activeTab === "menage" && (
          <div className="flex flex-col gap-10 animate-fade-in">
            <form onSubmit={handleAddTask} className="glass-card p-8 rounded-[2rem] flex flex-col gap-5">
              <h2 className="text-lg font-light uppercase tracking-widest text-stone-800 mb-2">Ajouter une tâche</h2>
              
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-medium uppercase tracking-widest text-stone-500">Pièce</label>
                <select 
                  value={room} 
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full bg-white/50 border border-stone-200 p-3 rounded-xl font-light text-sm focus:outline-none focus:border-stone-400"
                >
                  {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-medium uppercase tracking-widest text-stone-500">Nom (ex: Four, Aspirateur)</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/50 border border-stone-200 p-3 rounded-xl font-light text-sm focus:outline-none focus:border-stone-400"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-medium uppercase tracking-widest text-stone-500">À faire tous les (1 à 30 jours)</label>
                <input 
                  type="number" 
                  min="1" max="30"
                  value={frequency} 
                  onChange={(e) => setFrequency(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-white/50 border border-stone-200 p-3 rounded-xl font-light text-sm focus:outline-none focus:border-stone-400"
                />
              </div>

              {errorMenage && <p className="text-red-500 text-xs">{errorMenage}</p>}

              <button type="submit" className="w-full bg-stone-800 text-white px-4 py-4 mt-4 text-xs font-medium uppercase tracking-widest rounded-full hover:bg-stone-700 transition-all">
                Créer la tâche
              </button>
            </form>

            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-light uppercase tracking-widest text-stone-800 border-b border-stone-200 pb-3">Tâches existantes</h2>
              
              {tasks.length === 0 ? (
                <p className="text-stone-400 font-light text-sm">Aucune tâche enregistrée.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {ROOMS.map((roomName) => {
                    const roomTasks = tasks.filter(t => t.room === roomName);
                    if (roomTasks.length === 0) return null;

                    const isCollapsed = collapsedRooms.includes(roomName);

                    return (
                      <div key={roomName} className="glass-card p-5 rounded-2xl">
                        <div 
                          className={`flex justify-between items-center cursor-pointer ${isCollapsed ? '' : 'border-b border-stone-200/60 pb-4 mb-4'}`}
                          onClick={() => toggleRoom(roomName)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-stone-300">{isCollapsed ? '▶' : '▼'}</span>
                            <h3 className="text-base font-medium uppercase tracking-wide text-stone-800">{roomName}</h3>
                          </div>
                        </div>

                        {!isCollapsed && (
                          <div className="flex flex-col gap-3">
                            {roomTasks.map((task) => (
                              <div key={task.id} className="flex justify-between items-center bg-white/40 border border-stone-100 p-3 rounded-xl">
                                <div className="flex flex-col">
                                  <span className="font-light text-stone-800">{task.name}</span>
                                  <span className="text-[10px] text-stone-500 font-medium uppercase tracking-widest mt-1">
                                    Tous les {task.frequency_days} jour(s)
                                  </span>
                                </div>
                                <button 
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-[10px] font-medium uppercase tracking-widest text-red-500 hover:text-red-700 px-3 py-2 bg-red-50/50 rounded-lg transition-colors"
                                >
                                  Supprimer
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== ONGLET : PROFILS ==================== */}
        {activeTab === "profils" && (
          <div className="flex flex-col gap-10 animate-fade-in">
            
            {users.filter(u => u.name.toLowerCase() === "lana").map((user) => (
              <div key={user.id} className="glass-card p-6 rounded-[2rem] flex flex-col gap-4 border-stone-300/60">
                <div className="flex justify-between items-center border-b border-stone-200/60 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-light text-xl uppercase tracking-widest text-stone-800">{user.name}</span>
                    <span className="text-[9px] px-3 py-1 rounded-full font-medium uppercase tracking-widest bg-stone-800 text-white">
                      {user.role}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="Nouveau mot de passe..."
                    value={updatedPasswords[user.id] || ""}
                    onChange={(e) => setUpdatedPasswords({ ...updatedPasswords, [user.id]: e.target.value })}
                    className="flex-1 bg-white/50 border border-stone-200 p-3 rounded-xl font-light text-sm focus:outline-none"
                  />
                  <button 
                    onClick={() => handleUpdatePassword(user.id, user.name)}
                    className="bg-stone-800 text-white px-5 text-xs font-medium uppercase tracking-widest rounded-xl hover:bg-stone-700 transition-colors"
                  >
                    Modifier
                  </button>
                </div>
              </div>
            ))}

            <form onSubmit={handleAddUser} className="glass-card p-8 rounded-[2rem] flex flex-col gap-5">
              <h2 className="text-lg font-light uppercase tracking-widest text-stone-800 mb-2">Ajouter un sub</h2>
              
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-medium uppercase tracking-widest text-stone-500">Prénom</label>
                <input 
                  type="text" 
                  value={newUserName} 
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-white/50 border border-stone-200 p-3 rounded-xl font-light text-sm focus:outline-none focus:border-stone-400"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-medium uppercase tracking-widest text-stone-500">Mot de passe</label>
                <input 
                  type="text" 
                  value={newUserPassword} 
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full bg-white/50 border border-stone-200 p-3 rounded-xl font-light text-sm focus:outline-none focus:border-stone-400"
                />
              </div>

              {errorProfil && <p className="text-red-500 text-xs">{errorProfil}</p>}

              <button type="submit" className="w-full bg-stone-800 text-white px-4 py-4 mt-4 text-xs font-medium uppercase tracking-widest rounded-full hover:bg-stone-700 transition-all">
                Créer le sub
              </button>
            </form>

            <div className="flex flex-col gap-6">
              <h2 className="text-lg font-light uppercase tracking-widest text-stone-800 border-b border-stone-200 pb-3">Mes subs</h2>
              
              <div className="flex flex-col gap-4">
                {users.filter(u => u.name.toLowerCase() !== "lana").map((user) => (
                  <div key={user.id} className="glass-card p-5 rounded-2xl flex flex-col gap-4">
                    
                    <div className="flex justify-between items-center border-b border-stone-200/60 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-light text-lg uppercase tracking-wide text-stone-800">{user.name}</span>
                        <span className="text-[9px] px-2 py-1 rounded-full font-medium uppercase tracking-widest bg-stone-200 text-stone-600">
                          {user.role}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="text-[10px] text-red-500 font-medium uppercase hover:text-red-700 tracking-widest transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>

                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        placeholder="Nouveau mot de passe..."
                        value={updatedPasswords[user.id] || ""}
                        onChange={(e) => setUpdatedPasswords({ ...updatedPasswords, [user.id]: e.target.value })}
                        className="flex-1 bg-white/50 border border-stone-100 p-2.5 rounded-xl font-light text-sm focus:outline-none"
                      />
                      <button 
                        onClick={() => handleUpdatePassword(user.id, user.name)}
                        className="bg-stone-200 text-stone-800 px-4 text-[10px] font-medium uppercase tracking-widest rounded-xl hover:bg-stone-300 transition-colors"
                      >
                        Modifier
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}