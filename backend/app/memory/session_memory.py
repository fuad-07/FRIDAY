from typing import Any


class SessionMemory:
    def __init__(self) -> None:
        self._sessions: dict[str, list[dict[str, str]]] = {}
        self._session_files: dict[str, list[str]] = {}

    def add_message(self, session_id: str, role: str, content: str) -> None:
        if session_id not in self._sessions:
            self._sessions[session_id] = []
        self._sessions[session_id].append({"role": role, "content": content})

    def get_history(self, session_id: str, limit: int = 10) -> list[dict[str, str]]:
        return self._sessions.get(session_id, [])[-limit:]

    def clear(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)
        self._session_files.pop(session_id, None)

    def add_file(self, session_id: str, filename: str) -> None:
        if session_id not in self._session_files:
            self._session_files[session_id] = []
        if filename not in self._session_files[session_id]:
            self._session_files[session_id].append(filename)

    def get_files(self, session_id: str) -> list[str]:
        return self._session_files.get(session_id, [])


_session_memory: SessionMemory | None = None


def get_session_memory() -> SessionMemory:
    global _session_memory
    if _session_memory is None:
        _session_memory = SessionMemory()
    return _session_memory
