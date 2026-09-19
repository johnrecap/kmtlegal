export type DashboardNavItem = {
  label: string;
  href: string;
  icon: string;
  group?: string;
  active?: boolean;
};

type DashboardNavGroup = {
  group?: string;
  items: DashboardNavItem[];
};

export function groupDashboardNavItems(navItems: DashboardNavItem[]) {
  return navItems.reduce<DashboardNavGroup[]>((groups, navItem) => {
    const currentGroup = groups.at(-1);
    if (currentGroup && currentGroup.group === navItem.group) {
      currentGroup.items.push(navItem);
    } else {
      groups.push({ group: navItem.group, items: [navItem] });
    }
    return groups;
  }, []);
}
