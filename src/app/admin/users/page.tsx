"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  _count: { listings: number; ordersBuy: number; ordersSell: number };
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Row[]>([]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json());
    })();
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Users</h1>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-100 dark:bg-zinc-900">
            <tr>
              <th className="p-3">Email</th>
              <th className="p-3">Name</th>
              <th className="p-3">Role</th>
              <th className="p-3">Listings</th>
              <th className="p-3">Buy/Sell</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">{u._count.listings}</td>
                <td className="p-3">
                  {u._count.ordersBuy}/{u._count.ordersSell}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
