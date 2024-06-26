import React, {useState, useEffect} from 'react'
import {attach} from "@adobe/uix-guest"
import {
    defaultTheme,
    Flex,
    Provider,
    Content,
    Text,
    ButtonGroup,
    Button, Dialog, Divider
} from '@adobe/react-spectrum'
import {useParams} from "react-router-dom"
import {extensionId} from "./Constants"

export default function CFPageReferencesModal() {
    const GET_REFERENCES_URL = "/apps/eaem-cf-page-references/components/cf-page-references/references.html";
    const [guestConnection, setGuestConnection] = useState()
    const [references, setReferences] = useState({});

    const {fragmentId} = useParams()

    if (!fragmentId) {
        console.error("fragmentId parameter is missing")
        return
    }

    useEffect(() => {
        (async () => {
            const guestConnection = await attach({id: extensionId})

            setGuestConnection(guestConnection)

            const sharedContext = guestConnection.sharedContext,
                auth = sharedContext.get('auth');

            const baseUrl = `https://${sharedContext.get('aemHost')}${GET_REFERENCES_URL}${fragmentId}`;

            const requestOptions = {
                method: 'GET',
                headers: new Headers({
                    'Authorization': `Bearer ${auth['imsToken']}`,
                })
            };

            const res = await fetch(baseUrl, requestOptions);

            if (res.ok) {
                setReferences(await res.json());
            }
        })()
    })

    const onCloseHandler = () => {
        guestConnection.host.modal.close()
    }

    return (
        <Provider theme={defaultTheme}>
            <Content>
                <Flex direction="column" gap="size-125">
                    {
                        Object.entries(references).map(([path, title]) => {
                            return <Text>
                                <div>{title}</div>
                                <div>
                                    <a target="_blank"
                                       href={`https://${guestConnection.sharedContext.get('aemHost')}/bin/wcmcommand?cmd=open&path=${path}`}>
                                        {path}
                                    </a>
                                </div>
                            </Text>
                        })
                    }
                </Flex>
                <Flex width="100%" justifyContent="end" alignItems="center" height="70px">
                    <ButtonGroup align="end">
                        <Button variant="primary" onClick={onCloseHandler}>Close</Button>
                    </ButtonGroup>
                </Flex>
            </Content>
        </Provider>
    )
}
