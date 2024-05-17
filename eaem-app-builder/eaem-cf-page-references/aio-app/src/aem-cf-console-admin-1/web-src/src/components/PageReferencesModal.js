import React, {useState, useEffect} from 'react'
import {attach} from "@adobe/uix-guest"
import {
    Flex,
    Provider,
    Content,
    defaultTheme,
    Text,
    Item,
    ButtonGroup,
    Button,
    Dialog,
    Heading,
    Divider
} from '@adobe/react-spectrum'
import {useParams} from "react-router-dom"
import {extensionId} from "./Constants"

export default function PageReferencesModal() {
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
            } else {
                setReferences("Error loading references");
            }
        })()
    })

    const onCloseHandler = () => {
        guestConnection.host.modal.close()
    }

    return (
        <Provider theme={defaultTheme} colorScheme='dark'>
            <Content>
                <Flex direction="column" gap="size-125">
                    {
                        Object.entries(references).map(([path, title]) => {
                            return <Text>
                                        <div>{title}</div>
                                        <div>
                                            <a target="_blank" href="/bin/wcmcommand?cmd=open&path=${path}">
                                                {path}
                                            </a>
                                        </div>
                                    </Text>
                        })
                    }
                </Flex>
                <Flex width="100%" justifyContent="end" alignItems="center" marginTop="size-400">
                    <ButtonGroup align="end">
                        <Button variant="primary" onClick={onCloseHandler}>Close</Button>
                    </ButtonGroup>
                </Flex>
            </Content>
        </Provider>
    )
}
