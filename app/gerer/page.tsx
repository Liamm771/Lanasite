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
  
  // -- SYSTÈME D'ONGLETS --
  const [activeTab, setActiveTab] = useState<"menage" | "profils">("menage");

  // -- ÉTATS POUR LE MÉNAGE --
  const [tasks, setTasks] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [room, setRoom] = useState(ROOMS[0]);
  const [frequency, setFrequency] = useState<number | "">(1);
  const [errorMenage, setErrorMenage] = useState("");
  const [collapsedRooms, setCollapsedRooms] = useState<string[]>(ROOMS); // Toutes fermées par défaut

  // -- ÉTATS POUR LES PROFILS --
  const [users, setUsers] = useState<any[]>([]);
  const [newUserName, setNewUserName] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [errorProfil, setErrorProfil] = useState("");
  // Objet pour stocker temporairement les mots de passe modifiés par l'admin
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

  // -- REQUÊTES BDD --
  async function fetchTasks() {
    const { data } = await supabase.from("tasks").select("*").order("room");
    if (data) setTasks(data);
  }

  async function fetchUsers() {
    const { data } = await supabase.from("users").select("*").order("name");
    if (data) setUsers(data);
  }

  // -- ACTIONS MÉNAGE --
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

  // -- ACTIONS PROFILS --
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorProfil("");

    if (!newUserName.trim() || !newUserPassword.trim()) {
      setErrorProfil("Nom et mot de passe requis.");
      return;
    }

    // Le rôle est forcé sur "user"
    const { data, error } = await supabase
      .from("users")
      .insert([{ name: newUserName, password: newUserPassword, role: "user" }])
      .select();

    if (error) {
      setErrorProfil("Erreur lors de l'ajout : " + error.message);
    } else if (data) {
      setUsers([...users, data[0]]);
      setNewUserName("");
      setNewUserPassword("");
    }
  };

  const handleDeleteUser = async (id: string, userName: string) => {
    // Sécurité supplémentaire : impossible de supprimer Lana
    if (userName.toLowerCase() === "lana") {
      alert("Le compte administrateur principal ne peut pas être supprimé.");
      return;
    }

    if (window.confirm(`Es-tu sûr de vouloir supprimer le profil de ${userName} ? L'historique associé pourrait être impacté.`)) {
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
          GESTION
        </h1>

        {/* NAVIGATION DES ONGLETS */}
        <div className="flex w-full mb-10 border-[3px] border-black rounded-lg overflow-hidden bg-white">
          <button 
            onClick={() => setActiveTab("menage")}
            className={`flex-1 py-4 text-sm sm:text-base font-black uppercase tracking-widest transition-colors ${activeTab === "menage" ? "bg-black text-white" : "text-black hover:bg-gray-100"}`}
          >
            Ménage
          </button>
          <div className="w-[3px] bg-black"></div>
          <button 
            onClick={() => setActiveTab("profils")}
            className={`flex-1 py-4 text-sm sm:text-base font-black uppercase tracking-widest transition-colors ${activeTab === "profils" ? "bg-black text-white" : "text-black hover:bg-gray-100"}`}
          >
            Profils
          </button>
        </div>


        {/* ==================== ONGLET : MÉNAGE ==================== */}
        {activeTab === "menage" && (
          <div className="flex flex-col gap-10 animate-fade-in">
            {/* Formulaire Ajout Tâche */}
            <form onSubmit={handleAddTask} className="border-[3px] border-black p-5 bg-white rounded-lg shadow-sm flex flex-col gap-4">
              <h2 className="text-2xl font-bold uppercase">Ajouter une tâche</h2>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider">Pièce</label>
                <select 
                  value={room} 
                  onChange={(e) => setRoom(e.target.value)}
                  className="border-2 border-black p-2 rounded-md font-medium"
                >
                  {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider">Nom (ex: Four, Aspirateur)</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="border-2 border-black p-2 rounded-md font-medium"
                  placeholder="Nom de la tâche..."
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider">À faire tous les (1 à 30 jours)</label>
                <input 
                  type="number" 
                  min="1"
                  max="30"
                  value={frequency} 
                  onChange={(e) => setFrequency(e.target.value === "" ? "" : Number(e.target.value))}
                  className="border-2 border-black p-2 rounded-md font-medium"
                />
              </div>

              {errorMenage && <p className="text-red-500 font-bold text-sm">{errorMenage}</p>}

              <button type="submit" className="w-full border-[3px] border-black bg-black text-white px-4 py-3 mt-2 font-bold uppercase tracking-wider rounded-md active:bg-gray-800 transition-colors">
                Créer la tâche
              </button>
            </form>

            {/* Liste des Tâches Existantes */}
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold uppercase border-b-2 border-black pb-2">Tâches existantes</h2>
              
              {tasks.length === 0 ? (
                <p className="text-gray-400 italic font-medium">Aucune tâche enregistrée pour le moment.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {ROOMS.map((roomName) => {
                    const roomTasks = tasks.filter(t => t.room === roomName);
                    if (roomTasks.length === 0) return null;

                    const isCollapsed = collapsedRooms.includes(roomName);

                    return (
                      <div key={roomName} className="w-full border-2 border-black p-3 rounded-md bg-white">
                        <div 
                          className={`flex justify-between items-center cursor-pointer ${isCollapsed ? '' : 'border-b-2 border-black pb-2 mb-3'}`}
                          onClick={() => toggleRoom(roomName)}
                        >
                          <div className="flex items-center gap-2 select-none">
                            <span className="text-sm text-gray-400">{isCollapsed ? '▶' : '▼'}</span>
                            <h3 className="text-xl font-bold uppercase">{roomName}</h3>
                          </div>
                        </div>

                        {!isCollapsed && (
                          <div className="flex flex-col gap-2">
                            {roomTasks.map((task) => (
                              <div key={task.id} className="flex justify-between items-center bg-gray-50 border border-gray-200 p-2 rounded-md">
                                <div className="flex flex-col">
                                  <span className="font-bold">{task.name}</span>
                                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                                    Tous les {task.frequency_days} jour(s)
                                  </span>
                                </div>
                                <button 
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="border-2 border-black bg-white text-black px-3 py-1 text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors"
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
            
            {/* LE COMPTE DE LANA (Isolé, tout en haut) */}
            {users.filter(u => u.name.toLowerCase() === "lana").map((user) => (
              <div key={user.id} className="border-[3px] border-black p-4 rounded-md bg-white flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xl uppercase tracking-wide">{user.name}</span>
                    <span className="text-xs px-2 py-1 rounded font-bold uppercase tracking-wider bg-black text-white">
                      {user.role}
                    </span>
                  </div>
                  {/* Pas de bouton supprimer ici */}
                </div>

                <div className="flex gap-2 mt-1">
                  <input 
                    type="text" 
                    placeholder="Nouveau mot de passe..."
                    value={updatedPasswords[user.id] || ""}
                    onChange={(e) => setUpdatedPasswords({ ...updatedPasswords, [user.id]: e.target.value })}
                    className="flex-1 border-2 border-gray-300 p-2 rounded-md text-sm"
                  />
                  <button 
                    onClick={() => handleUpdatePassword(user.id, user.name)}
                    className="border-2 border-black bg-white text-black px-4 font-bold text-xs uppercase hover:bg-black hover:text-white transition-colors rounded-md"
                  >
                    Modifier
                  </button>
                </div>
              </div>
            ))}

            {/* Formulaire Ajout Profil */}
            <form onSubmit={handleAddUser} className="border-[3px] border-black p-5 bg-white rounded-lg shadow-sm flex flex-col gap-4">
              <h2 className="text-2xl font-bold uppercase">Ajouter un profil</h2>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider">Prénom</label>
                <input 
                  type="text" 
                  value={newUserName} 
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="border-2 border-black p-2 rounded-md font-medium"
                  placeholder="Ex: Clara"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider">Mot de passe</label>
                <input 
                  type="text" 
                  value={newUserPassword} 
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="border-2 border-black p-2 rounded-md font-medium"
                />
              </div>

              {errorProfil && <p className="text-red-500 font-bold text-sm">{errorProfil}</p>}

              <button type="submit" className="w-full border-[3px] border-black bg-black text-white px-4 py-3 mt-2 font-bold uppercase tracking-wider rounded-md active:bg-gray-800 transition-colors">
                Créer le profil
              </button>
            </form>

            {/* Liste des autres Profils Existants */}
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-bold uppercase border-b-2 border-black pb-2">Profils existants</h2>
              
              <div className="flex flex-col gap-4">
                {users.filter(u => u.name.toLowerCase() !== "lana").map((user) => (
                  <div key={user.id} className="border-2 border-black p-4 rounded-md bg-white flex flex-col gap-3">
                    
                    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xl uppercase tracking-wide">{user.name}</span>
                        <span className="text-xs px-2 py-1 rounded font-bold uppercase tracking-wider bg-gray-200 text-black">
                          {user.role}
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="text-xs text-red-500 font-bold uppercase hover:text-red-700 tracking-wider transition-colors"
                      >
                        Supprimer
                      </button>
                    </div>

                    <div className="flex gap-2 mt-1">
                      <input 
                        type="text" 
                        placeholder="Nouveau mot de passe..."
                        value={updatedPasswords[user.id] || ""}
                        onChange={(e) => setUpdatedPasswords({ ...updatedPasswords, [user.id]: e.target.value })}
                        className="flex-1 border-2 border-gray-300 p-2 rounded-md text-sm"
                      />
                      <button 
                        onClick={() => handleUpdatePassword(user.id, user.name)}
                        className="border-2 border-black bg-white text-black px-4 font-bold text-xs uppercase hover:bg-black hover:text-white transition-colors rounded-md"
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