import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "scripts"))

import utils


def test_pad_base64():
    assert utils._pad_base64("aGVsbG8") == "aGVsbG8="
    assert utils._pad_base64("aGVsbG8=") == "aGVsbG8="
    # Excess padding is normalized away before re-padding.
    assert utils._pad_base64("aGVsbG8==") == "aGVsbG8="


def test_safe_b64decode():
    assert utils.safe_b64decode("aGVsbG8=") == b"hello"
    assert utils.safe_b64decode("aGVsbG8") == b"hello"
    assert utils.safe_b64decode("") is None
    assert utils.safe_b64decode("!!!") is None


def test_decode_bytes():
    assert utils.decode_bytes(b"hello") == "hello"
    # gbk encoded Chinese
    assert utils.decode_bytes("\u4e2d\u6587".encode("gbk")) == "\u4e2d\u6587"


def test_is_private_host():
    assert utils.is_private_host("") is True
    assert utils.is_private_host(None) is True
    assert utils.is_private_host("127.0.0.1") is True
    assert utils.is_private_host("192.168.1.1") is True
    assert utils.is_private_host("10.0.0.1") is True
    assert utils.is_private_host("example.com") is False
    assert utils.is_private_host("example.local") is True
    # IPv6 brackets must be stripped before evaluation.
    assert utils.is_private_host("[fe80::1]") is True
    assert utils.is_private_host("[2606:4700:4700::1111]") is False
    # Link-local / unspecified addresses must be blocked.
    assert utils.is_private_host("169.254.169.254") is True
    assert utils.is_private_host("0.0.0.0") is True


def test_validate_url_allowed():
    utils.validate_url("https://raw.githubusercontent.com/foo/bar")


def test_validate_url_disallowed():
    try:
        utils.validate_url("http://raw.githubusercontent.com/foo/bar")
        assert False, "should reject http"
    except utils.ConfigurationError:
        pass

    try:
        utils.validate_url("https://evil.com/foo/bar")
        assert False, "should reject unexpected host"
    except utils.ConfigurationError:
        pass


def test_load_sources_valid():
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        f.write('{"free_node_sources": [], "free_proxy_apis": []}')
        path = Path(f.name)
    try:
        data = utils.load_sources(path)
        assert data["free_node_sources"] == []
        assert data["free_proxy_apis"] == []
    finally:
        path.unlink()


def test_load_sources_invalid_json():
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        f.write("not json")
        path = Path(f.name)
    try:
        try:
            utils.load_sources(path)
            assert False, "should raise ConfigurationError"
        except utils.ConfigurationError:
            pass
    finally:
        path.unlink()


def test_load_sources_missing():
    try:
        utils.load_sources(Path("/nonexistent/path/sources.json"))
        assert False, "should raise ConfigurationError"
    except utils.ConfigurationError:
        pass


def test_load_sources_wrong_type():
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        f.write('"string"')
        path = Path(f.name)
    try:
        try:
            utils.load_sources(path)
            assert False, "should raise ConfigurationError"
        except utils.ConfigurationError:
            pass
    finally:
        path.unlink()


if __name__ == "__main__":
    test_pad_base64()
    test_safe_b64decode()
    test_decode_bytes()
    test_is_private_host()
    test_validate_url_allowed()
    test_validate_url_disallowed()
    test_load_sources_valid()
    test_load_sources_invalid_json()
    test_load_sources_missing()
    test_load_sources_wrong_type()
    print("utils tests passed")
