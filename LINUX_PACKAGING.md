# Linux Package Distribution Guide

This document explains how to distribute Absolute Scenes on Linux through various package managers and repositories.

## Distribution Strategy

Since getting into official repositories (Ubuntu/Debian/Fedora) is extremely difficult for individual developers, we focus on more accessible options that still provide professional distribution channels.

## Available Distribution Methods

### 1. AppImage (Current - Already Working!)
- ✅ **Universal compatibility** across all Linux distributions
- ✅ **No installation required** - single executable file
- ✅ **Already building** in your current workflow
- 🎯 **Best option** for immediate distribution

### 2. Flathub (Recommended Next Step)
- 🌟 **Most popular** universal Linux package manager
- ✅ **Wide distribution** - available on most Linux distributions
- ✅ **Professional appearance** in software centers
- ✅ **Automatic updates** for users

**Setup Process:**
1. Submit to [Flathub GitHub](https://github.com/flathub/flathub)
2. Use the configuration in `linux-packaging/flatpak/`
3. Community review process (usually 1-2 weeks)
4. Free to submit and maintain

### 3. Snap Store (Ubuntu Focus)
- 🎯 **Ubuntu/Ubuntu-based distros** primary audience
- ✅ **Official Canonical support**
- ✅ **Built-in to Ubuntu Software Center**

**Setup Process:**
1. Create account at [Snapcraft.io](https://snapcraft.io)
2. Use the configuration in `linux-packaging/snap/`
3. Automatic building and publishing available

### 4. Personal Package Archive (PPA) - Ubuntu
- 🎯 **Ubuntu/Debian users** can easily install
- ✅ **Traditional apt package management**
- ✅ **Free to create and maintain**

**Setup Process:**
1. Create account at [Launchpad.net](https://launchpad.net)
2. Set up PPA repository
3. Use configurations in `linux-packaging/ppa/`

### 5. COPR - Fedora/RHEL
- 🎯 **Fedora/RHEL/CentOS users**
- ✅ **Official Red Hat community platform**
- ✅ **RPM package format**

**Setup Process:**
1. Create account at [COPR](https://copr.fedorainfracloud.org/)
2. Submit RPM spec file from `linux-packaging/copr/`

## Priority Recommendations

### **Phase 1: Easy Wins (Do First)**
1. **Keep building AppImages** ✅ (already working)
2. **Submit to Flathub** 🌟 (highest impact, wide reach)
3. **Submit to Snap Store** (good Ubuntu coverage)

### **Phase 2: If Time Permits**
4. **Set up PPA** (Ubuntu traditional package users)
5. **Set up COPR** (Fedora/RHEL users)

### **Phase 3: Future (Don't Worry About Now)**
- Official repository inclusion (very difficult)
- Other smaller package managers

## User Installation Experience

### **Current (AppImage)**
```bash
# Download from GitHub releases
chmod +x Absolute.Scenes-1.3.111.AppImage
./Absolute.Scenes-1.3.111.AppImage
```

### **After Flathub Submission**
```bash
# Most Linux distributions
flatpak install flathub com.absolutescenes.app
flatpak run com.absolutescenes.app
```

### **After Snap Store Submission**
```bash
# Ubuntu and Snap-enabled distros
sudo snap install absolute-scenes
absolute-scenes
```

### **After PPA Setup (Ubuntu)**
```bash
# Ubuntu/Debian users
sudo add-apt-repository ppa:adamshort/absolute-scenes
sudo apt update
sudo apt install absolute-scenes
```

### **After COPR Setup (Fedora)**
```bash
# Fedora/RHEL users
sudo dnf copr enable adamshort/absolute-scenes
sudo dnf install absolute-scenes
```

## Implementation Steps

### 1. Flathub Submission (Recommended First)

**Prepare:**
1. Update `linux-packaging/flatpak/com.absolutescenes.app.yml` with current version
2. Copy application icon to `linux-packaging/flatpak/absolute-scenes-icon.png`
3. Test locally with flatpak-builder

**Submit:**
1. Fork [flathub/flathub](https://github.com/flathub/flathub)
2. Create PR with your app configuration
3. Community review and approval
4. Automatic building and distribution

### 2. Snap Store Submission

**Prepare:**
1. Update version in `linux-packaging/snap/snapcraft.yaml`
2. Test build locally with snapcraft

**Submit:**
1. Register account at snapcraft.io
2. Register app name: `absolute-scenes`
3. Upload snap or configure automatic building

### 3. PPA Setup (Ubuntu)

**Prepare:**
1. Create Launchpad account and GPG key
2. Update version in `linux-packaging/ppa/debian/changelog`
3. Build source package

**Submit:**
1. Create PPA: `ppa:adamshort/absolute-scenes`
2. Upload source package with `dput`
3. Launchpad builds for multiple Ubuntu versions

## Benefits Summary

| Method | Reach | Ease | Professional | Updates |
|--------|-------|------|-------------|---------|
| AppImage | ★★★★★ | ★★★★★ | ★★★ | Manual |
| Flathub | ★★★★★ | ★★★★ | ★★★★★ | Auto |
| Snap Store | ★★★★ | ★★★★ | ★★★★ | Auto |
| PPA | ★★★ | ★★★ | ★★★★ | Auto |
| COPR | ★★ | ★★★ | ★★★★ | Auto |

## Getting Started

1. **Keep your AppImage builds** (already working great!)
2. **Start with Flathub** - biggest impact for effort invested
3. **Add Snap Store** - good complementary coverage
4. **Consider PPA/COPR** if you want to serve traditional package users

The universal packages (Flathub/Snap) give you the most professional distribution with the least maintenance overhead.