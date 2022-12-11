const groupBy = <T>(array: T[], predicate: (v: T) => string) =>
    array.reduce((acc, value) => {
        (acc[predicate(value)] ||= []).push(value);
        return acc;
    }, {} as { [key: string]: T[] });

export interface Notifications {
    id: string;
    duration: number;
    position:
    | "center"
    | "top-center"
    | "top-start"
    | "top-end"
    | "bottom-center"
    | "bottom-start"
    | "bottom-end";
    title: string;
    message: string;
    type: "success" | "info" | "warning" | "error";
}

const notifications = ref<Notifications[]>([]);

const positionedNotifications = computed(() =>
    groupBy(notifications.value, (v) => v.position)
);

export const notify = ({
    position = "bottom-end",
    type = "success",
    duration = 6000,
    message = "",
    title = "",
}: Partial<Notifications>) => {
    const id = `notification-${performance.now()}`;

    notifications.value.push({
        duration,
        id,
        message,
        position,
        title,
        type,
    });
};

export function useNotification() {
    const deleteItem = (id: string, timeout?: number) => {
        setTimeout(() => {
            notifications.value = notifications.value.filter((v) => v.id !== id);
        }, timeout);
    };

    onMounted(() => {
        //@ts-ignore
        window.notify = notify;
    })

    return {
        notifications,
        positionedNotifications,
        deleteItem,
        notify,
    };
}