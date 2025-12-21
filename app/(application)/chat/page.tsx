"use client";
function Page() {
  return (
    <div className="grid grid-cols-[1fr_6fr_15fr] h-full gap-4 py-2 px-3">
      <div className="bg-white border rounded-2xl border-slate-300 container">
        profile
      </div>
      <div className="bg-white border rounded-2xl border-slate-300 container">
        chats
      </div>
      <div className="bg-white border rounded-2xl border-slate-300 container">
        window
      </div>
    </div>
  );
}

export default Page;
