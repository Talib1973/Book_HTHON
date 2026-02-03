/**
 * PersonalizationEngine
 *
 * Applies and reverts content personalization via DOM class-based targeting.
 *
 * Authors can mark doc content with these CSS classes:
 *   .advanced-tip      — Hidden for beginners (python_experience === 'beginner')
 *   .beginner-note     — Hidden for advanced users (python_experience === 'advanced')
 *   .ros-advanced      — Hidden when ros_experience is 'none' or 'beginner'
 *   .gpu-required      — Replaced with .gpu-alternative when user has no RTX GPU
 *
 * The engine toggles display on matching elements and swaps GPU content pairs.
 */

interface UserProfile {
  python_experience: string;
  ros_experience: string;
  has_rtx_gpu: boolean;
  has_jetson: boolean;
  [key: string]: unknown;
}

// Track original state so we can revert cleanly
const hiddenElements: { el: HTMLElement; originalDisplay: string }[] = [];
const swappedElements: { gpu: HTMLElement; alt: HTMLElement }[] = [];

export function applyPersonalization(profile: UserProfile): void {
  revertPersonalization(); // always start fresh

  const doc = document.querySelector('article') || document;

  // ── Advanced tips: hide for beginners ──
  if (profile.python_experience === 'beginner') {
    hideElements(doc, '.advanced-tip');
  }

  // ── Beginner notes: hide for advanced ──
  if (profile.python_experience === 'advanced') {
    hideElements(doc, '.beginner-note');
  }

  // ── ROS advanced: hide when user lacks ROS experience ──
  if (profile.ros_experience === 'none' || profile.ros_experience === 'beginner') {
    hideElements(doc, '.ros-advanced');
  }

  // ── GPU content: swap .gpu-required with .gpu-alternative when no GPU ──
  if (!profile.has_rtx_gpu) {
    const gpuBlocks = doc.querySelectorAll<HTMLElement>('.gpu-required');
    gpuBlocks.forEach((gpuEl) => {
      // Look for a sibling .gpu-alternative immediately after
      const alt = gpuEl.nextElementSibling as HTMLElement | null;
      if (alt && alt.classList.contains('gpu-alternative')) {
        const origGpu = gpuEl.style.display;
        gpuEl.style.display = 'none';
        alt.style.display = '';
        hiddenElements.push({ el: gpuEl, originalDisplay: origGpu });
        swappedElements.push({ gpu: gpuEl, alt });
      }
    });
  }
}

export function revertPersonalization(): void {
  // Restore hidden elements
  hiddenElements.forEach(({ el, originalDisplay }) => {
    el.style.display = originalDisplay;
  });
  hiddenElements.length = 0;

  // Restore swapped GPU pairs
  swappedElements.forEach(({ gpu, alt }) => {
    gpu.style.display = '';
    alt.style.display = 'none';
  });
  swappedElements.length = 0;
}

function hideElements(root: Element | Document, selector: string): void {
  root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    hiddenElements.push({ el, originalDisplay: el.style.display });
    el.style.display = 'none';
  });
}
