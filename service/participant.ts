import { isEnterRequest } from "@/domain/participant/participantRequest";


async function enter(body : unknown) {
    if (!isEnterRequest(body)) {
        throw new Error("Invalid request");
    }
    const { groupId, meetingId } = body;
    // 비즈니스 로직
}

const body = await json();
const result = await participantService.enter(body);