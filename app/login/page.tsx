"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const router = useRouter();
  // État pour stocker dynamiquement les profils de Supabase
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase.from("users").select("id, name");
      
      if (data && data.length > 0) {
        setUsers(data);
        // On sélectionne automatiquement le premier nom de la liste par défaut
        setSelectedUser(data[0].name);
      }
    }
    fetchUsers();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const { data, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("name", selectedUser)
      .eq("password", password)
      .single();

    if (fetchError) {
      setError("Erreur BDD : " + fetchError.message);
      return;
    }

    if (data) {
      localStorage.setItem("user", JSON.stringify(data));
      router.push("/");
    } else {
      setError("Mot de passe incorrect.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans text-black bg-white w-full">
      <form onSubmit={handleLogin} className="w-full max-w-sm border-[3px] border-black p-6 bg-white rounded-lg shadow-sm flex flex-col gap-6">
        <h1 className="text-3xl font-black text-center uppercase tracking-widest border-b-2 border-black pb-4">
          Connexion
        </h1>

        <div className="flex flex-col gap-2">
          <label className="font-bold uppercase tracking-wider text-sm">Qui es-tu ?</label>
          <select 
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="border-2 border-black p-3 rounded-md text-lg bg-white"
          >
            {/* Génération automatique des options depuis la base de données */}
            {users.map((u) => (
              <option key={u.id} value={u.name}>{u.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-bold uppercase tracking-wider text-sm">Mot de passe</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-2 border-black p-3 rounded-md text-lg"
          />
        </div>

        {error && <p className="text-red-500 font-bold text-center">{error}</p>}

        <button type="submit" className="w-full border-[3px] border-black bg-black text-white px-6 py-3 mt-2 text-lg font-bold uppercase tracking-wider rounded-lg active:bg-gray-800 transition-colors">
          Valider
        </button>
      </form>
    </div>
  );
}