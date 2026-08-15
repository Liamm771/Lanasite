"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Login() {
  const router = useRouter();
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      const { data, error } = await supabase.from("users").select("id, name");
      
      if (data && data.length > 0) {
        setUsers(data);
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
    <div className="min-h-screen flex flex-col items-center justify-center p-6 w-full">
      <form onSubmit={handleLogin} className="w-full max-w-sm glass-card rounded-[2rem] p-10 flex flex-col gap-8">
        <div className="text-center">
          <h1 className="font-title text-6xl text-center text-stone-800 mb-2">
  Palais de maitresse Lana
</h1>
          <p className="text-xs tracking-widest uppercase text-stone-400 mt-2">Connexion</p>
        </div>

        <div className="flex flex-col gap-6 mt-4">
          <div className="flex flex-col gap-2">
            <select 
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full bg-transparent border-b border-stone-300 py-2 text-stone-800 focus:outline-none focus:border-stone-800 transition-colors cursor-pointer"
            >
              {users.map((u) => (
                <option key={u.id} value={u.name}>{u.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <input 
              type="password" 
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-stone-300 py-2 text-stone-800 focus:outline-none focus:border-stone-800 transition-colors placeholder:text-stone-400 placeholder:font-light"
            />
          </div>
        </div>

        {error && <p className="text-red-500 font-medium text-xs text-center">{error}</p>}

        <button type="submit" className="w-full bg-stone-800 text-white px-6 py-4 mt-4 text-xs font-medium uppercase tracking-[0.15em] rounded-full hover:bg-stone-700 transition-all shadow-lg shadow-stone-800/20">
          Entrer
        </button>
      </form>
    </div>
  );
}