"""git_repo 适配器：浅克隆 git 仓库，按 glob 读文件内容拼成文本。"""

from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path

from utils import FetchError

# git clone 超时（秒）
_CLONE_TIMEOUT = 60


class GitRepoAdapter:
    """git_repo 源：克隆仓库到临时目录，按 ``file_patterns`` glob 读取文件。"""

    @property
    def source_type(self) -> str:
        return "git_repo"

    def fetch(self, source: dict) -> str:
        if not shutil.which("git"):
            raise FetchError("git command not found; install git to use git_repo sources")

        repo_url = source["repo_url"]
        patterns = source.get("file_patterns", ["*"])
        tmpdir = tempfile.mkdtemp(prefix="git_repo_")
        try:
            subprocess.run(
                ["git", "clone", "--depth", "1", repo_url, tmpdir],
                capture_output=True,
                timeout=_CLONE_TIMEOUT,
                check=True,
            )
            return self._read_patterns(Path(tmpdir), patterns)
        except subprocess.TimeoutExpired as exc:
            raise FetchError(f"git clone timed out after {_CLONE_TIMEOUT}s: {repo_url}") from exc
        except subprocess.CalledProcessError as exc:
            err = ""
            if exc.stderr:
                err = (exc.stderr.decode("utf-8", errors="ignore") if isinstance(exc.stderr, bytes) else str(exc.stderr))[
                    :200
                ]
            raise FetchError(f"git clone failed: {err}") from exc
        finally:
            # 不管成功失败都清掉临时目录
            shutil.rmtree(tmpdir, ignore_errors=True)

    @staticmethod
    def _read_patterns(root: Path, patterns: list[str]) -> str:
        parts: list[str] = []
        seen: set[str] = set()
        for pattern in patterns:
            for path in root.glob(pattern):
                if not path.is_file():
                    continue
                key = str(path)
                if key in seen:
                    continue
                seen.add(key)
                parts.append(path.read_text(encoding="utf-8", errors="ignore"))
        return "\n".join(parts)
