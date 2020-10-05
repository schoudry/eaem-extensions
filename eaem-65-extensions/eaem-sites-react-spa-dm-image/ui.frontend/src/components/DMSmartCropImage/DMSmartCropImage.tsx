import { MapTo } from '@adobe/cq-react-editable-components';
import React, { Component } from 'react';
import { Link } from "react-router-dom";
import CSS from 'csstype';

function isObjectEmpty(obj) {
    return (Object.keys(obj).length == 0);
}

interface ImageComponentProps {
    smartCrops: object
    fileReference: string
    imageLink: string
}

interface ImageComponentState {
    imageSrc: string
}

const ImageEditConfig = {
    emptyLabel: 'Dynamic Media Smart Crop Image - Experience AEM',

    isEmpty: function (props) {
        return (!props || !props.fileReference || (props.fileReference.trim().length < 1));
    }
};

class Image extends React.Component<ImageComponentProps, ImageComponentState> {
    constructor(props: ImageComponentProps) {
        super(props);

        this.state = {
            imageSrc: this.imageUrl()
        }
    }

    componentDidMount() {
        window.addEventListener('resize', this.updateImage.bind(this));
    }

    componentDidUpdate(){
        console.log("in update");

        const currentSrc = this.state.imageSrc;
        const newSrc = this.imageUrl();

        if(currentSrc != newSrc){
            this.updateImage();
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.updateImage);
    }

    updateImage(){
        this.setState({
            imageSrc: this.imageUrl()
        })
    }

    imageUrl() {
        const imageProps = this.props;
        let src = imageProps.fileReference;

        if (!isObjectEmpty(imageProps.smartCrops)) {
            const breakPoints = Object.keys(imageProps.smartCrops).sort((a: any, b: any) => b - a);

            for (const i in breakPoints) {
                let bp = parseInt(breakPoints[i]);

                if (bp < window.innerWidth) {
                    src = imageProps.smartCrops[bp];
                    break;
                }
            }
        }

        return src;
    }

    get imageHTML() {
        const imgStyles: CSS.Properties = {
            display : 'block',
            marginLeft: 'auto',
            marginRight: 'auto'
        };

        return (
            <Link to={this.props.imageLink}>
                <img src={this.state.imageSrc} style={imgStyles} />
            </Link>
        );
    }

    render() {
        return this.imageHTML;
    }
}

export default MapTo('eaem-sites-spa-how-to-react/components/dm-image-smart-crop')(Image, ImageEditConfig);
