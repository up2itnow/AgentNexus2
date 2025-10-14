# 🔒 AgentNexus Security Configuration

This directory contains security profiles and configurations for agent execution.

---

## 📋 Seccomp Profile

**File:** `seccomp-profile.json`

### What is Seccomp?

**Seccomp (Secure Computing Mode)** is a Linux kernel security feature that filters system calls (syscalls) an application can make. It's one of the most powerful security mechanisms in Linux.

### Our Security Strategy

**Default Action:** `SCMP_ACT_ERRNO` (Deny by default)  
**Philosophy:** Whitelist only essential syscalls needed for agents

### Allowed Syscalls (50+)

#### 1. File I/O Operations ✅
- `read`, `write`, `open`, `openat`, `close`
- `stat`, `fstat`, `lstat`
- `lseek`, `access`, `pipe`, `dup`
- `fcntl`, `flock`, `fsync`
- `truncate`, `ftruncate`
- `getcwd`, `chdir`, `readlink`

**Why:** Agents need to read input and write output

#### 2. Memory Management ✅
- `mmap`, `munmap`, `mprotect`
- `madvise`, `brk`, `mremap`

**Why:** Python and Node.js runtimes require dynamic memory allocation

#### 3. Process Lifecycle ✅
- `exit`, `exit_group`
- `wait4`, `waitid`
- `rt_sigaction`, `rt_sigprocmask`
- `getpid`, `getuid`, `getgid`

**Why:** Essential for process management and cleanup

#### 4. Time Operations ✅
- `clock_gettime`, `clock_getres`
- `gettimeofday`, `nanosleep`

**Why:** Agents may need timestamps and delays

#### 5. Threading (Limited) ✅
- `clone`, `futex`
- `set_robust_list`, `get_robust_list`

**Why:** Python GIL, Node.js event loop require minimal threading

#### 6. System Information ✅
- `uname`, `getrlimit`, `getrusage`
- `sysinfo`, `times`, `getrandom`

**Why:** Runtime introspection and random number generation

#### 7. Execution ✅
- `execve`, `execveat`

**Why:** Container entry point execution

### Blocked Syscalls (100+)

**Dangerous operations explicitly blocked:**

❌ **Network Operations**
- `socket`, `connect`, `bind`, `listen`, `accept`
- `sendto`, `recvfrom`, `sendmsg`, `recvmsg`

❌ **Privilege Escalation**
- `setuid`, `setgid`, `setreuid`, `setregid`
- `setresuid`, `setresgid`
- `capset`, `setcap`

❌ **System Modification**
- `mount`, `umount`, `umount2`
- `pivot_root`, `chroot`
- `swapon`, `swapoff`

❌ **Kernel Manipulation**
- `ptrace` (debugging/inspection)
- `process_vm_readv`, `process_vm_writev`
- `kexec_load`, `kexec_file_load`

❌ **Device Access**
- `ioctl` (device control)
- `mknod` (device creation)

❌ **Advanced IPC**
- `msgget`, `msgsnd`, `msgrcv`
- `semget`, `semop`, `shmget`

---

## 🚀 Usage

### In ExecutionService

```typescript
const container = await docker.createContainer({
  Image: agentImage,
  HostConfig: {
    SecurityOpt: [
      'no-new-privileges:true',
      'seccomp=/path/to/seccomp-profile.json'
    ]
  }
});
```

### Testing Seccomp Profile

```bash
# Test if profile allows basic operations
docker run --rm \
  --security-opt seccomp=./seccomp-profile.json \
  agentnexus-python-echo:v1

# Test if profile blocks dangerous operations
docker run --rm \
  --security-opt seccomp=./seccomp-profile.json \
  alpine sh -c "nc -l 8080"  # Should fail (no socket syscall)
```

---

## 🛡️ Security Layers

AgentNexus uses **defense-in-depth** with multiple security layers:

### Layer 1: Container Isolation
- Non-root user (UID 1000)
- No network access (`--network=none`)
- Read-only root filesystem (optional)

### Layer 2: Resource Limits
- 512MB RAM limit
- 50% CPU quota
- 100 PID limit

### Layer 3: Capabilities
- All Linux capabilities dropped (`CapDrop: ['ALL']`)
- No new privileges (`no-new-privileges:true`)

### Layer 4: Seccomp (This Layer)
- Syscall whitelist (only 50+ allowed)
- Blocks 100+ dangerous syscalls
- Prevents kernel exploits

### Layer 5: AppArmor/SELinux (Optional)
- Filesystem access restrictions
- Process confinement
- MAC (Mandatory Access Control)

---

## 📊 Security Impact

### What This Prevents

✅ **Container Escape Attacks**
- Blocked: `mount`, `pivot_root`, `chroot`
- Blocked: `ptrace`, `process_vm_*`

✅ **Network Exfiltration**
- Blocked: All `socket` syscalls
- Network mode: `none` (double protection)

✅ **Privilege Escalation**
- Blocked: `setuid`, `setgid`, `capset`
- No new privileges flag set

✅ **Kernel Exploits**
- Blocked: `kexec_load`, `bpf`, `perf_event_open`
- Minimal syscall attack surface

✅ **Device Access**
- Blocked: `ioctl`, `mknod`
- No access to host devices

### Performance Impact

- **Overhead:** < 1% (seccomp is kernel-level)
- **Startup Time:** No measurable impact
- **Runtime:** Negligible overhead

---

## 🧪 Testing Seccomp Profile

### Test 1: Verify Basic Operations Work

```bash
# Should succeed
docker run --rm \
  --security-opt seccomp=./seccomp-profile.json \
  -e INPUT_DATA='{"query":"test"}' \
  agentnexus-python-echo:v1
```

### Test 2: Verify Network is Blocked

```bash
# Should fail (blocked by seccomp + network=none)
docker run --rm \
  --security-opt seccomp=./seccomp-profile.json \
  alpine sh -c "wget google.com"
```

### Test 3: Verify Mount is Blocked

```bash
# Should fail
docker run --rm \
  --security-opt seccomp=./seccomp-profile.json \
  alpine sh -c "mount -t tmpfs tmpfs /mnt"
```

### Test 4: Verify Ptrace is Blocked

```bash
# Should fail
docker run --rm \
  --security-opt seccomp=./seccomp-profile.json \
  alpine sh -c "strace ls"
```

---

## 📚 References

- [Docker Seccomp Documentation](https://docs.docker.com/engine/security/seccomp/)
- [Linux Seccomp BPF](https://www.kernel.org/doc/html/latest/userspace-api/seccomp_filter.html)
- [Docker Default Seccomp Profile](https://github.com/moby/moby/blob/master/profiles/seccomp/default.json)
- [OWASP Container Security](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)

---

## 🔧 Customization

### Adding New Syscalls

If agents need additional syscalls (e.g., for specific libraries):

1. Identify required syscall:
   ```bash
   strace -c python agent.py 2>&1 | grep "syscall"
   ```

2. Add to `seccomp-profile.json`:
   ```json
   {
     "names": ["new_syscall"],
     "action": "SCMP_ACT_ALLOW"
   }
   ```

3. Test thoroughly:
   ```bash
   docker run --security-opt seccomp=./seccomp-profile.json ...
   ```

4. Document why it's needed (security audit trail)

### Strictness Levels

**Current Profile:** Balanced (50+ syscalls allowed)

**More Strict:** Remove threading (`clone`, `futex`)  
**More Permissive:** Add IPC syscalls (not recommended)

---

## ⚠️ Important Notes

### Don't Disable Seccomp!

❌ **Bad:** `--security-opt seccomp=unconfined`  
✅ **Good:** Use our custom profile

### Profile Maintenance

- Review profile quarterly
- Update when adding new agent capabilities
- Test changes in staging before production
- Keep audit log of changes

### Production Deployment

1. Store profile in `/etc/agentnexus/seccomp-profile.json`
2. Reference in ExecutionService
3. Version control (track changes)
4. Monitor for denied syscalls (audit logs)

---

*Seccomp profile created with AstraForge 5-LLM Security Expert*  
*AgentNexus Team - October 2025*

